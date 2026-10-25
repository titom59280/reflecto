const pool = require('../utils/dbHelper');
const { createMember } = require('../utils/memberUtils');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateToken } = require('../utils/tokenUtils');
const { resultRequest } = require('../utils/requestUtils');

// Nombre de membres inclus par offre (cf. page des tarifs) : 3 en Gratuit, 5 en Standard, illimité en Pro
function maxMembersFor(subscriptionLevel) {
  const level = String(subscriptionLevel);
  if (level === '0') return 3;
  if (level === '1') return 5;
  return Infinity;
}

const hashEmail = (email) =>
  crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

async function teamBelongsToCompany(teamId, companyId) {
  const team = await pool.queryOne('SELECT id FROM teams WHERE id = $1 AND companyid = $2', [
    teamId,
    companyId,
  ]);
  return !!team;
}

exports.getAll = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    // isActive : le membre a défini son mot de passe (jamais le mot de passe lui-même)
    const members = await pool.query(
      `SELECT id, name, trigramme, isscrummaster as "isScrumMaster", isfulladmin as "isFullAdmin", teamid as "teamId", companyid as "companyId", (password IS NOT NULL AND password <> '') as "isActive" FROM members WHERE companyId = $1 ORDER BY name`,
      [req.user.companyId]
    );
    const company = await pool.queryOne('SELECT subscriptionlevel FROM companies WHERE id = $1', [
      req.user.companyId,
    ]);
    const limit = maxMembersFor(company.subscriptionlevel);
    const result = {
      members,
      membersRemaining: members.length < limit ? 1 : 0,
      membersLimit: Number.isFinite(limit) ? limit : null,
    };
    resultRequest(res, true, '', result);
  } catch (err) {
    console.error('[member.getAll] erreur', err);
    let message = 'Erreur lors de la lecture des membres';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'MEMBERS_FETCH_ERROR');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    // Limite de l'offre vérifiée côté serveur
    const company = await pool.queryOne('SELECT subscriptionlevel FROM companies WHERE id = $1', [
      req.user.companyId,
    ]);
    const count = await pool.queryOne(
      'SELECT COUNT(*)::int AS count FROM members WHERE companyid = $1',
      [req.user.companyId]
    );
    if (count.count >= maxMembersFor(company?.subscriptionlevel))
      return resultRequest(
        res,
        false,
        "Votre offre ne permet pas d'ajouter d'autres membres",
        {},
        'MEMBER_LIMIT_REACHED'
      );

    if (!(await teamBelongsToCompany(req.body.teamId, req.user.companyId)))
      return resultRequest(res, false, 'Équipe non trouvée', {}, 'TEAM_NOT_FOUND');

    const datas = {
      companyId: req.user.companyId,
      email: (req.body.email || '').trim(),
      name: (req.body.name || '').trim(),
      trigramme: (req.body.trigramme || '').trim(),
      teamId: req.body.teamId,
      isScrumMaster: req.body.isScrumMaster === true,
    };
    const result = await createMember(datas);

    if (!result.success) {
      resultRequest(res, false, result.message, {}, result.code);
      return;
    }

    resultRequest(res, true, '', result.result);
  } catch (err) {
    console.error('[member.create] erreur', err);
    let message = 'Erreur lors de la création du membre';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'MEMBER_CREATE_ERROR');
  }
};

exports.chooseColorPostIt = async (req, res) => {
  try {
    const member = await pool.queryOne('SELECT * FROM members WHERE id = $1', [req.user?.id]);
    if (!member)
      return resultRequest(
        res,
        false,
        'Membre introuvable',
        { user: req.user },
        'MEMBER_NOT_FOUND'
      );

    const { color } = req.body;
    await pool.query('UPDATE members SET color = $1 WHERE id = $2', [color, req.user.id]);

    resultRequest(res, true, color);
  } catch (err) {
    let message = 'Erreur lors de la sélection de la couleur';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'COLOR_UPDATE_ERROR');
  }
};

exports.update = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    const id = req.params.id;

    // Le membre doit appartenir à la compagnie de l'utilisateur
    const user = await pool.queryOne(
      `SELECT id, name, trigramme, password, isscrummaster as "isScrumMaster", isfulladmin as "isFullAdmin", teamid as "teamId", companyid as "companyId" FROM members WHERE id = $1 AND companyid = $2`,
      [id, req.user.companyId]
    );
    if (!user) return resultRequest(res, false, 'Membre introuvable', {}, 'MEMBER_NOT_FOUND');

    const name = (req.body.name || '').trim();
    const trigramme = (req.body.trigramme || '').trim().toUpperCase();
    const isScrumMaster = req.body.isScrumMaster === true;
    if (!name || !trigramme)
      return resultRequest(res, false, 'Informations requises', {}, 'MEMBER_INFO_REQUIRED');

    if (!(await teamBelongsToCompany(req.body.teamId, req.user.companyId)))
      return resultRequest(res, false, 'Équipe non trouvée', {}, 'TEAM_NOT_FOUND');

    // Garde-fou : un Scrum Master ne retire pas son propre rôle (perte d'accès à l'administration)
    if (id === req.user.id && !isScrumMaster)
      return resultRequest(
        res,
        false,
        'Vous ne pouvez pas retirer votre propre rôle de Scrum Master',
        {},
        'SELF_ROLE_REMOVAL'
      );

    // Email modifiable uniquement tant que le compte n'est pas activé (correction de saisie)
    let emailHash = null;
    const newEmail = (req.body.email || '').trim();
    if (newEmail) {
      if (user.password)
        return resultRequest(
          res,
          false,
          "L'email ne peut plus être modifié : le compte est déjà activé",
          {},
          'MEMBER_EMAIL_LOCKED'
        );
      emailHash = hashEmail(newEmail);
      const sameEmail = await pool.queryOne(
        'SELECT id FROM members WHERE email = $1 AND id <> $2',
        [emailHash, id]
      );
      if (sameEmail)
        return resultRequest(res, false, 'Email déja utilisé', {}, 'EMAIL_ALREADY_USED');
    }

    await pool.query(
      'UPDATE members SET name = $1, trigramme = $2, isscrummaster = $3, teamid = $4, email = COALESCE($5, email) WHERE id = $6 AND companyid = $7',
      [name, trigramme, isScrumMaster, req.body.teamId, emailHash, id, req.user.companyId]
    );

    resultRequest(res, true, '', {
      id,
      name,
      trigramme,
      isScrumMaster,
      teamId: req.body.teamId,
      isActive: !!user.password,
    });
  } catch (err) {
    console.error('[member.update] erreur', err);
    let message = 'Erreur lors de la modification du membres';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'MEMBER_UPDATE_ERROR');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    const id = req.params.id;

    if (id === req.user.id)
      return resultRequest(
        res,
        false,
        'Vous ne pouvez pas supprimer votre propre compte',
        {},
        'SELF_DELETE'
      );

    const member = await pool.queryOne('SELECT id FROM members WHERE id = $1 AND companyid = $2', [
      id,
      req.user.companyId,
    ]);
    if (!member) return resultRequest(res, false, 'Membre introuvable', {}, 'MEMBER_NOT_FOUND');

    await pool.query('DELETE FROM members WHERE id = $1 AND companyid = $2', [
      id,
      req.user.companyId,
    ]);
    // Une seule réponse (l'ancien code envoyait res.json puis resultRequest)
    resultRequest(res, true, '', {});
  } catch (err) {
    console.error('[member.remove] erreur', err);
    // Clé étrangère : le membre a des post-its dans l'historique des rétros
    if (err.code === '23503')
      return resultRequest(
        res,
        false,
        "Ce membre a des post-its dans l'historique des rétros et ne peut pas être supprimé",
        {},
        'MEMBER_HAS_HISTORY'
      );
    let message = 'Erreur lors de la suppression du membre';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'MEMBER_DELETE_ERROR');
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email, forCompagnie } = req.body;

    const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const user = await pool.queryOne('SELECT * FROM members WHERE email = $1', [hashedEmail]);

    if (!forCompagnie && !user)
      return resultRequest(
        res,
        false,
        'Adresse non reconnue. Veuillez contacter votre Scrum Master',
        {},
        'EMAIL_NOT_RECOGNIZED'
      );
    if (forCompagnie && user)
      return resultRequest(
        res,
        false,
        'Adresse déjà inscrite. Veuillez entrer une nouvelle adresse email',
        {},
        'EMAIL_ALREADY_REGISTERED_NEW'
      );

    if (forCompagnie && !user) return resultRequest(res, true, '', {});
    const alreadyRegister = !!user.password;
    if (alreadyRegister) {
      return resultRequest(
        res,
        false,
        'Adresse déjà inscrite. Veuillez vous connecter.',
        {},
        'EMAIL_ALREADY_REGISTERED_LOGIN'
      );
    }
    resultRequest(res, true, '', {});
  } catch (err) {
    let message = "Erreur lors de la vérification de l'email";
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'EMAIL_CHECK_ERROR');
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
      return resultRequest(
        res,
        false,
        'Email et mot de passe (6+ caractères) requis',
        {},
        'EMAIL_PASSWORD_REQUIRED'
      );
    }
    const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const user = await pool.queryOne(
      `SELECT id, name, email, trigramme, isscrummaster as "isScrumMaster", isfulladmin as "isFullAdmin", teamid as "teamId", companyid as "companyId"  FROM members WHERE email = $1`,
      [hashedEmail]
    );
    if (!user) return resultRequest(res, false, 'Utilisateur non trouvé', {}, 'USER_NOT_FOUND');

    // SÉCURITÉ : cette route sert uniquement à l'activation d'un compte (premier mot de passe).
    // Sans ce contrôle, connaître l'email suffisait à remplacer le mot de passe d'un compte actif.
    const existing = await pool.queryOne('SELECT password FROM members WHERE id = $1', [user.id]);
    if (existing?.password)
      return resultRequest(
        res,
        false,
        'Adresse déjà inscrite. Veuillez vous connecter.',
        {},
        'EMAIL_ALREADY_REGISTERED_LOGIN'
      );

    user.password = await bcrypt.hash(password, 10);

    await pool.query('UPDATE members SET password = $1 WHERE id = $2', [user.password, user.id]);

    const team = await pool.queryOne(
      `SELECT id, name, companyid as "companyId" FROM teams WHERE id = $1`,
      [user.teamId]
    );

    const token = generateToken(user);
    resultRequest(res, true, '', { user: { ...user, password: undefined, team: team }, token });
  } catch (err) {
    let message = 'Erreur lors de la mise à jour du mot de passe';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'PASSWORD_UPDATE_ERROR');
  }
};
