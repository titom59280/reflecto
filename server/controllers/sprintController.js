const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    const sprints = await pool.query(
      `SELECT id, name, isactif as "isActif", companyid as "companyID", isclosed as "isClosed", isretrodone as "isRetroDone", createdat as "createdAt" FROM sprints WHERE companyid = $1 ORDER BY createdat DESC`,
      [req.user.companyId]
    );
    resultRequest(
      res,
      true,
      '',
      sprints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  } catch (err) {
    let message = 'Erreur lors de la récupération des sprints';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'SPRINTS_FETCH_ERROR');
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');
    const { isActive = false, isClosed = false, isRetroDone = false } = req.body;
    // Nom libre (numéro ou texte), sans doublon dans la compagnie
    const name = (req.body.name || '').trim();
    if (!name) return resultRequest(res, false, 'Nom obligatoire', {}, 'NAME_REQUIRED');
    const sameName = await pool.queryOne(
      'SELECT id FROM sprints WHERE UPPER(name) = UPPER($1) AND companyid = $2',
      [name, req.user.companyId]
    );
    if (sameName)
      return resultRequest(
        res,
        false,
        'Un sprint avec ce nom existe déjà',
        {},
        'SPRINT_NAME_EXISTS'
      );
    const company = await pool.queryOne('SELECT * from companies WHERE id = $1', [
      req.user.companyId,
    ]);
    if (!company) return resultRequest(res, false, 'Compagnie non trouvé', {}, 'COMPANY_NOT_FOUND');

    const newSprint = {
      id: crypto.randomUUID(),
      name,
      isActive,
      companyId: req.user.companyId,
      isClosed,
      isRetroDone,
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      'INSERT INTO sprints (id, name, isactif, companyid, isclosed, isretrodone, createdat) VALUES ($1, $2, $3, $4, $5, $6,$7)',
      [newSprint.id, name, isActive, req.user.companyId, isClosed, isRetroDone, newSprint.createdAt]
    );
    resultRequest(res, true, '', newSprint);
  } catch (err) {
    let message = 'Erreur lors de la création du sprint';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'SPRINT_CREATE_ERROR');
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user === undefined || req.user === null)
      return resultRequest(res, false, 'Methode non accessible', {}, 'METHOD_NOT_ALLOWED');

    // [DEBUG suppression sprint] logs temporaires, à retirer une fois le problème compris
    console.log('[sprint.remove] demande', {
      sprintId: req.params.id,
      companyId: req.user.companyId,
    });

    // Le sprint doit appartenir à la compagnie de l'utilisateur
    const sprint = await pool.queryOne('SELECT id FROM sprints WHERE id = $1 AND companyid = $2', [
      req.params.id,
      req.user.companyId,
    ]);
    console.log('[sprint.remove] sprint trouvé pour la compagnie :', !!sprint);
    if (!sprint) return resultRequest(res, false, 'Sprint introuvable', {}, 'SPRINT_NOT_FOUND');

    // Tous les liens du sprint, pour voir les vraies valeurs (et leur type) de isclosed
    const allLinks = await pool.query(
      'SELECT id, teamid, retroid, isactif, isclosed, isretroinprogress, isretrodone FROM sprintsretrosteams WHERE sprintid = $1',
      [req.params.id]
    );
    console.log(
      '[sprint.remove] liens du sprint :',
      allLinks.map((l) => ({ ...l, typeIsclosed: typeof l.isclosed }))
    );

    // pool.query renvoie un tableau : un tableau vide est "truthy", il faut tester sa longueur
    const notClosedRetro = await pool.query(
      'SELECT id FROM sprintsretrosteams WHERE sprintid = $1 AND isclosed= false',
      [req.params.id]
    );
    console.log('[sprint.remove] liens non clôturés :', notClosedRetro.length, notClosedRetro);
    if (notClosedRetro.length > 0)
      return resultRequest(
        res,
        false,
        'Une rétro liée est encore active',
        {},
        'LINKED_RETRO_ACTIVE'
      );

    await pool.query('DELETE FROM sprints WHERE id = $1', [req.params.id]);
    resultRequest(res, true, '', {});
  } catch (err) {
    console.error('[sprint.remove] erreur', err);
    let message = 'Erreur lors de la suppression du sprint';
    if (process.env.LOG_STATUS == 'all') {
      message = err.message;
    }
    resultRequest(res, false, message, {}, 'SPRINT_DELETE_ERROR');
  }
};
