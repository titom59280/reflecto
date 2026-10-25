const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

// Nombre d'équipes autorisé par offre (cf. page des tarifs) : 1 en Gratuit et Standard, illimité en Pro
function maxTeamsFor(subscriptionLevel) {
  return String(subscriptionLevel) === '2' ? Infinity : 1;
}

async function countTeams(companyId) {
  const row = await pool.queryOne('SELECT COUNT(*)::int AS count FROM teams WHERE companyid = $1', [
    companyId,
  ]);
  return row.count;
}

exports.getAll = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    const teams = await pool.query(
      `SELECT id, name, companyid as "companyId" FROM teams WHERE companyid = $1`,
      [req.user.companyId]
    );
    resultRequest(res, true, '', teams);
  } catch (err) {
    let message = 'Erreur lors de la récupération des équipes';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'TEAMS_FETCH_ERROR');
  }
};

exports.getAllWithMembers = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    const teams = await pool.query(
      `SELECT id, name, companyid as "companyId" FROM teams WHERE companyid = $1`,
      [req.user.companyId]
    );

    const company = await pool.queryOne(
      `SELECT id, name, subscriptionlevel as "subscriptionLevel" FROM companies WHERE id = $1`,
      [req.user.companyId]
    );

    // 1 si l'offre permet encore de créer une équipe, 0 sinon
    const teamsRemaining = teams.length < maxTeamsFor(company.subscriptionLevel) ? 1 : 0;

    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await pool.query(
          'SELECT id, name, trigramme FROM members WHERE teamid = $1',
          [team.id]
        );
        // Historique de rétros : une équipe qui a servi ne peut pas être supprimée
        const history = await pool.queryOne(
          'SELECT id FROM sprintsretrosteams WHERE teamid = $1 LIMIT 1',
          [team.id]
        );

        return {
          ...team,
          members,
          hasHistory: !!history,
        };
      })
    );

    const result = { teamsRemaining, teams: teamsWithMembers };
    resultRequest(res, true, '', result);
  } catch (err) {
    let message = 'Erreur lors de la récupération des équipes';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'TEAMS_FETCH_ERROR');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    const name = (req.body.name || '').trim();
    if (!name) return resultRequest(res, false, 'Nom obligatoire', {}, 'NAME_REQUIRED');
    const team = await pool.queryOne(
      'SELECT * FROM teams WHERE UPPER(name) = UPPER($1) AND companyid = $2',
      [name, req.user.companyId]
    );
    if (team)
      return resultRequest(res, false, 'Une équipe porte déjà ce nom', {}, 'TEAM_NAME_EXISTS');

    // Limite de l'offre vérifiée côté serveur (l'interface seule ne suffit pas)
    const company = await pool.queryOne('SELECT subscriptionlevel FROM companies WHERE id = $1', [
      req.user.companyId,
    ]);
    if ((await countTeams(req.user.companyId)) >= maxTeamsFor(company?.subscriptionlevel))
      return resultRequest(
        res,
        false,
        "Votre offre ne permet pas de créer d'autres équipes",
        {},
        'TEAM_LIMIT_REACHED'
      );

    const newTeam = { id: crypto.randomUUID(), name, companyId: req.user.companyId };
    await pool.query('INSERT INTO teams (id, name, companyid) VALUES ($1, $2, $3)', [
      newTeam.id,
      name,
      req.user.companyId,
    ]);
    resultRequest(res, true, '', newTeam);
  } catch (err) {
    let message = "Erreur lors de la création de l'équipe";
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'TEAM_CREATE_ERROR');
  }
};

exports.update = async (req, res) => {
  try {
    const updatedTeam = req.body;
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    // L'équipe doit appartenir à la compagnie de l'utilisateur
    const team = await pool.queryOne('SELECT * FROM teams WHERE id = $1 AND companyid = $2', [
      req.params.id,
      req.user.companyId,
    ]);
    if (!team) return resultRequest(res, false, 'Équipe non trouvée', {}, 'TEAM_NOT_FOUND');

    const name = (updatedTeam.name || '').trim();
    if (!name) return resultRequest(res, false, 'Nom obligatoire', {}, 'NAME_REQUIRED');
    const sameName = await pool.queryOne(
      'SELECT id FROM teams WHERE UPPER(name) = UPPER($1) AND companyid = $2 AND id <> $3',
      [name, req.user.companyId, req.params.id]
    );
    if (sameName)
      return resultRequest(res, false, 'Une équipe porte déjà ce nom', {}, 'TEAM_NAME_EXISTS');

    // La colonne est « id » (et non « teamid ») : l'ancienne requête échouait sans être vue
    await pool.query('UPDATE teams SET name = $1 WHERE id = $2 AND companyid = $3', [
      name,
      req.params.id,
      req.user.companyId,
    ]);
    team.name = name;
    resultRequest(res, true, '', team);
  } catch (err) {
    let message = "Erreur lors de la mise à jour de l'équipe";
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'TEAM_UPDATE_ERROR');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    const team = await pool.queryOne('SELECT id FROM teams WHERE id = $1 AND companyid = $2', [
      req.params.id,
      req.user.companyId,
    ]);
    if (!team) return resultRequest(res, false, 'Équipe non trouvée', {}, 'TEAM_NOT_FOUND');

    const member = await pool.queryOne('SELECT id FROM members WHERE teamid = $1 LIMIT 1', [
      req.params.id,
    ]);
    const history = await pool.queryOne(
      'SELECT id FROM sprintsretrosteams WHERE teamid = $1 LIMIT 1',
      [req.params.id]
    );
    if (member || history)
      return resultRequest(
        res,
        false,
        'Seule une équipe sans membre ni historique de rétros peut être supprimée',
        {},
        'TEAM_NOT_EMPTY'
      );

    await pool.query('DELETE FROM teams WHERE id = $1 AND companyid = $2', [
      req.params.id,
      req.user.companyId,
    ]);
    resultRequest(res, true, '', {});
  } catch (err) {
    console.error('[team.remove] erreur', err);
    let message = "Erreur lors de la suppression de l'équipe";
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'TEAM_DELETE_ERROR');
  }
};
