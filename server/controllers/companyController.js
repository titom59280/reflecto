const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { createMember } = require('../utils/memberUtils');
const { resultRequest } = require('../utils/requestUtils');

const SUBSCRIPTION_LEVELS = ['0', '1', '2'];

// Crée la compagnie, sa première équipe et son Scrum Master ; annule tout si le membre échoue
async function createCompanyWithScrumMaster(res, body, subscriptionLevel) {
  const companyName = (body.companyName || '').trim();
  const teamName = (body.teamName || '').trim();
  const scrumMasterEmail = (body.scrumMasterEmail || '').trim();
  const scrumMasterName = (body.scrumMasterName || '').trim();
  const scrumMasterTrigramme = (body.scrumMasterTrigramme || '').trim();
  if (!companyName || !scrumMasterEmail || !scrumMasterName || !scrumMasterTrigramme || !teamName)
    return resultRequest(
      res,
      false,
      'informations entreprise équipe ou scrumMaster manquantes.',
      {},
      'COMPANY_SIGNUP_FIELDS_MISSING'
    );

  const company = await pool.queryOne('SELECT id FROM companies WHERE UPPER(name) = UPPER($1)', [
    companyName,
  ]);
  if (company)
    return resultRequest(
      res,
      false,
      'Une entreprise avec ce nom existe déjà',
      {},
      'COMPANY_NAME_EXISTS'
    );

  const idCompany = crypto.randomUUID();
  const idTeam = crypto.randomUUID();
  const newCompany = { id: idCompany, name: companyName, subscriptionLevel };

  await pool.query('INSERT INTO companies (id, name, subscriptionlevel) VALUES ($1, $2, $3)', [
    idCompany,
    companyName,
    subscriptionLevel,
  ]);
  // Nouvelle compagnie : son équipe ne peut entrer en conflit avec aucune autre
  await pool.query('INSERT INTO teams (id, companyid, name) VALUES ($1, $2, $3)', [
    idTeam,
    idCompany,
    teamName,
  ]);

  const result = await createMember({
    companyId: idCompany,
    email: scrumMasterEmail,
    teamId: idTeam,
    name: scrumMasterName,
    trigramme: scrumMasterTrigramme,
    isScrumMaster: true,
  });

  if (!result.success) {
    await pool.query('DELETE FROM teams where id = $1', [idTeam]);
    await pool.query('DELETE FROM companies where id = $1', [idCompany]);
    return resultRequest(res, false, result.message, {}, result.code);
  }

  return resultRequest(
    res,
    true,
    "Inscription effectuée, le scrum Master peut désormais s'inscrire à son tour",
    newCompany,
    'COMPANY_SIGNUP_SUCCESS'
  );
}

exports.getAll = async (req, res) => {
  try {
    // Avec le nombre d'équipes et de membres, pour repérer les compagnies hors limite
    const companies = await pool.query(
      `SELECT c.id, c.name, c.subscriptionlevel AS "subscriptionLevel",
        (SELECT COUNT(*)::int FROM teams t WHERE t.companyid = c.id) AS "teamsCount",
        (SELECT COUNT(*)::int FROM members m WHERE m.companyid = c.id) AS "membersCount",
        (SELECT MAX(s.createdat) FROM sprints s WHERE s.companyid = c.id) AS "lastActivity"
       FROM companies c ORDER BY c.name`,
      []
    );
    resultRequest(res, true, '', companies);
  } catch (err) {
    console.error('[company.getAll] erreur', err);
    let message = 'Erreur lors de la récupération des entreprises';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'COMPANIES_FETCH_ERROR');
  }
};

// Indicateurs globaux de la plateforme (full admin uniquement)
exports.getPlatformStats = async (req, res) => {
  try {
    const stats = await pool.queryOne(
      `SELECT
        (SELECT COUNT(*)::int FROM companies) AS "companies",
        (SELECT COUNT(*)::int FROM members) AS "members",
        (SELECT COUNT(*)::int FROM members WHERE password IS NULL OR password = '') AS "inactiveMembers",
        (SELECT COUNT(*)::int FROM sprintsretrosteams WHERE isclosed = false AND isretrodone = false) AS "openRetros"`,
      []
    );
    resultRequest(res, true, '', stats);
  } catch (err) {
    console.error('[company.getPlatformStats] erreur', err);
    let message = 'Erreur lors de la récupération des statistiques';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'PLATFORM_STATS_ERROR');
  }
};

exports.getCompanieForUser = async (req, res) => {
  try {
    const companie = await pool.queryOne(
      `SELECT id, name, subscriptionlevel AS "subscriptionLevel" FROM companies where id = $1`,
      [req.user.companyId]
    );
    resultRequest(res, true, '', companie);
  } catch (err) {
    let message = "Erreur lors de la récupération de l'entreprise";
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'COMPANY_FETCH_ERROR');
  }
};

// Inscription publique d'une entreprise : toujours en offre gratuite
// (le niveau envoyé par le navigateur est ignoré)
exports.create = async (req, res) => {
  try {
    await createCompanyWithScrumMaster(res, req.body, '0');
  } catch (err) {
    console.error('[company.create] erreur', err);
    let message = 'Erreur lors de la création de la compagnie';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'COMPANY_CREATE_ERROR');
  }
};

// Création depuis l'administration (full admin uniquement) : l'offre peut être choisie
exports.adminCreate = async (req, res) => {
  try {
    const level = String(req.body.subscriptionLevel ?? '0');
    if (!SUBSCRIPTION_LEVELS.includes(level))
      return resultRequest(res, false, 'Offre inconnue', {}, 'SUBSCRIPTION_LEVEL_INVALID');
    await createCompanyWithScrumMaster(res, req.body, level);
  } catch (err) {
    console.error('[company.adminCreate] erreur', err);
    let message = 'Erreur lors de la création de la compagnie';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'COMPANY_CREATE_ERROR');
  }
};

exports.update = async (req, res) => {
  try {
    const { companyId } = req.body;
    const companyName = (req.body.companyName || '').trim();
    const subscriptionLevel = String(req.body.subscriptionLevel ?? '');
    if (!companyId || !companyName || !subscriptionLevel) {
      return resultRequest(
        res,
        false,
        'informations entreprise ou niveau manquantes.',
        {},
        'COMPANY_UPDATE_FIELDS_MISSING'
      );
    }
    if (!SUBSCRIPTION_LEVELS.includes(subscriptionLevel))
      return resultRequest(res, false, 'Offre inconnue', {}, 'SUBSCRIPTION_LEVEL_INVALID');

    const company = await pool.queryOne(
      `SELECT id, name, subscriptionlevel AS "subscriptionLevel" FROM companies where id = $1`,
      [companyId]
    );
    if (!company)
      return resultRequest(res, false, 'Compagnie non trouvée', {}, 'COMPANY_NOT_FOUND');

    const sameName = await pool.queryOne(
      'SELECT id FROM companies WHERE UPPER(name) = UPPER($1) AND id <> $2',
      [companyName, companyId]
    );
    if (sameName)
      return resultRequest(
        res,
        false,
        'Une entreprise avec ce nom existe déjà',
        {},
        'COMPANY_NAME_EXISTS'
      );

    // WHERE indispensable : sans lui, toutes les compagnies étaient modifiées
    await pool.query('UPDATE companies SET name = $1, subscriptionlevel = $2 WHERE id = $3', [
      companyName,
      subscriptionLevel,
      companyId,
    ]);
    resultRequest(res, true, '', { ...company, name: companyName, subscriptionLevel });
  } catch (err) {
    console.error('[company.update] erreur', err);
    let message = 'Erreur de la mise a jour de la compagnie';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'COMPANY_UPDATE_ERROR');
  }
};
