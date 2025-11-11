const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const links = await pool.query(
      `SELECT id, retroid AS "retroId", sprintid AS "sprintId", teamid AS "teamId", companyid AS "companyId", isactif AS "isActif", isclosed AS "isClosed", isretroinprogress AS "isRetroInProgress", isretrodone AS "isRetroDone" FROM sprintsretrosteams where companyId = $1`,
      [req.user.companyId]
    );
    resultRequest(res, true, '', links);
  }catch(err){
    let message = "Erreur lors de la récupération des liens rétro-sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.getForUser = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const result = await pool.query(
      `SELECT s.id, s.retroid AS "retroId", s.sprintid AS "sprintId", s.teamid AS "sprintId", s.companyid AS "companyId", s.isactif AS "isActif", s.isclosed AS "isClosed", s.isretroinprogress AS "isRetroInProgress", s.isretrodone AS "isRetroDone", t.name AS "teamName", r.name AS "retroName", sp.name AS "sprintName" FROM sprintsretrosteams S JOIN teams t ON t.id = s.teamid JOIN retros r ON r.id = s.retroid JOIN sprints sp ON sp.id = s.sprintid WHERE s.teamid = $1 AND s.isretrodone= false AND s.isclosed= false`,
      [req.user.teamId]
    );
    
    resultRequest(res, true, '', result);
  } catch(err) {
    let message = "Erreur lors de la récupération des liens rétro-sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.getForTeam = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const teamId = req.params.teamId;    
    const team = await pool.queryOne(
      "SELECT * FROM teams WHERE id = $1",
      [teamId]);
    if (!team) return resultRequest(res, false, 'Équipe non trouvé', { });

    const result = await pool.query(
      `SELECT s.id, s.retroid AS "retroId", s.sprintid AS "sprintId", s.teamid AS "teamId", s.companyid AS "companyId", s.isactif AS "isActif", s.isclosed AS "isClosed", s.isretroinprogress AS "isRetroInProgress", s.isretrodone AS "isRetroDone", t.name AS "teamName", r.name AS "retroName", sp.name AS "sprintName" FROM sprintsretrosteams S JOIN teams t ON t.id = s.teamid JOIN retros r ON r.id = s.retroid JOIN sprints sp ON sp.id = s.sprintid WHERE s.teamid = $1 AND s.isretrodone= false AND s.isclosed= false`,
      [teamId]
    );
    resultRequest(res, true, '', result);
  } catch(err) {
    let message = "Erreur lors de la récupération des liens rétro-sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.create = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { retroId, sprintId, teamId } = req.body;
    if (!sprintId || !retroId || !teamId) {
      return resultRequest(res, false, "identifiants du sprint de la rétro et de l'équipe sont requis", { });
    }

    
    const sprint = await pool.queryOne(
      "SELECT * FROM sprints WHERE id = $1",
      [sprintId]
    );
    const retro = await pool.queryOne(
      "SELECT * FROM retros WHERE id = $1",
      [retroId]
    );
    const team = await pool.queryOne(
      "SELECT * FROM teams WHERE id = $1",
      [teamId]
    );

    if (!sprint || !retro || !team) return resultRequest(res, false, 'Sprint, rétro ou équipe introuvable', { });

    const link = await pool.queryOne(
      "SELECT * FROM sprintsretrosteams WHERE sprintid = $1 AND retroid = $2 AND teamId = $3",
      [sprintId, retroId, teamId]
    );
    if (link) return resultRequest(res, false, 'Une rétro est déjà associée à ce sprint pour cette équipe.', { });

    const newLink = {
      id: crypto.randomUUID(),
      retroId,
      sprintId,
      teamId,
      companyId: req.user.companyId,
      isActif: false,
      isClosed: false,
      isRetroInProgress: false,
      isRetroDone: false,
    };
    await pool.query(
      "INSERT INTO sprintsretrosteams (id, retroid, sprintid, teamid, companyid, isactif, isclosed, isretroinprogress, isretrodone) VALUES ($1, $2, $3, $4, $5, false, false, false, false)",
      [newLink.id, retroId, sprintId, teamId, req.user.companyId]
    );
    resultRequest(res, true, '', newLink);
  } catch(err) {
    let message = "Erreur de la création du lien rétro-sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message + err.stack;
    }
    resultRequest(res, false, message, { });
  }
};

exports.remove = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const id = req.params.id;
    const link = await pool.queryOne(
      "SELECT *  FROM sprintsretrosteams WHERE id = $1",
      [id]
    );
    if (!link) return resultRequest(res, false, 'Lien non trouvé', { });
    
    if (link?.isRetroDone) return resultRequest(res, false, 'Impossible de supprimer un lien rétro associée à un sprint terminé', { });

    await pool.query(
      "DELETE FROM sprintsretrosteams WHERE id = $1",
      [id]
    );
    resultRequest(res, true, '', { });
  } catch(err) {
    let message = "Erreur de la suppression du lien rétro-sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message,  { });
  }
};

exports.getNextSprintName = async(req, res) =>{
  try {    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const teamId = req.params.teamId;
    const currentLinkId = req.params.currentLinkId;

    const link = await pool.queryOne(
      "SELECT * FROM sprintsretrosteams where id = $1",
      [currentLinkId]
    );
    if (!link) return resultRequest(res, false, 'Lien non trouvé', { });

    const currentSprintId = link.sprintId;
    const result = await pool.queryOne(
      `SELECT s.id, s.name, s.isactif AS "iSActif", s.companyid AS "companyId", s.isclosed AS "isClosed", s.isretrodone AS "isRetroDone", s.createdat AS "createdAt" FROM sprints s JOIN sprintsretrosteams links ON links.sprintid = s.id WHERE s.id <> $1 AND links.isclosed= false and links.teamid = $2`,
      [currentSprintId, teamId]
    );
    
    resultRequest(res, true, '', result);
  } catch(err) {
    let message = "Erreur lors de la récupération du nom du prochain sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.markRetroDone = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { currentLinkId, nextSprintId, teamId } = req.body;
    const link = await pool.queryOne(
       `SELECT id, isactif AS "isActif", retroid AS "retroId", sprintid AS "sprintId", teamid AS "teamId", companyid AS "companyId", isclosed AS "isClosed", isretrodone AS "isRetroDone", isretroinprogress AS "isRetroInProgress" FROM sprintsretrosteams where id = $1`,
      [currentLinkId]
    );
    if (!link) return resultRequest(res, false, 'Lien non trouvé', { });
    
    const sprint = await pool.queryOne(
      "SELECT * FROM sprints where id = $1",
      [link.sprintId]
    );
    if (!sprint) return resultRequest(res, false, 'sprint non trouvé', { });

    link.isRetroDone = true;
    link.isRetroInProgress = false;
    link.isActif = false;
    await pool.query(
      "UPDATE sprintsretrosteams SET isretrodone= true, isretroinprogress= false, isactif= false  WHERE id = $1",
      [link.id]
    );
    const linksInProgressForSprint = await pool.queryOne(
      "SELECT * FROM sprintsretrosteams where sprintId = $1 AND isretrodone= false",
      [sprint.id]
    );
    
    if(!linksInProgressForSprint || linksInProgressForSprint.length === 0) {
      await pool.query(
        "UPDATE sprints SET isclosed= true WHERE id = $1",
        [sprint.id]
      );
    }
    
    if(nextSprintId) {
      const nextLink = await pool.queryOne(
        "SELECT * FROM sprintsretrosteams WHERE id = $1 AND teamid = $2",
        [nextSprintId, teamId]
      );
      if (!nextLink) return resultRequest(res, false, 'Lien non trouvé pour le prochain sprint', { });
      
      await pool.query(
        "UPDATE sprintsretrosteams SET isactif= true WHERE id = $1 AND teamid = $2",
        [nextSprintId, teamId]
      );
    }
    
    resultRequest(res, true, '', link);
  } catch(err) {
    let message = "Erreur lors de la mise à jour du statut du lien";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message,{ });
  }
};

exports.markClosed = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { currentLinkId } = req.body;
    
    const link = await pool.queryOne(
      "SELECT * FROM sprintsretrosteams where id = $1",
      [currentLinkId]
    );
    if (!link) return resultRequest(res, false, 'Lien non trouvé', { });

    await pool.query(
      "UPDATE sprintsretrosteams SET isclosed= true WHERE id = $1",
      [currentLinkId]
    );
    resultRequest(res, true, '', { });
  } catch(err) {
    let message = "Erreur lors de la mise à jour du statut du lien";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.activate = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { linkId } = req.body;
    const link = await pool.queryOne(
      "SELECT * FROM sprintsretrosteams where id = $1",[linkId]
    );
    if (!link) return resultRequest(res, false, 'Lien non trouvé', { });

    const activeRetro = await pool.queryOne(
      "SELECT * FROM sprintsretrosteams WHERE teamId = $1 AND isactif= true",
      [link.teamId]
    );
    if (activeRetro) return resultRequest(res, false, 'Il y a déjà une rétro active pour cette équipe', { });
    
    await pool.query(
      "UPDATE sprintsretrosteams SET isactif= true WHERE id = $1",
      [linkId]
    );
    resultRequest(res, true, '', { });
  }catch(err){
    let message = "Erreur lors de l'activation de la rétro";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.markRetroStart = async (req, res) => {
  try {    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { currentLinkId } = req.body;
    const link = await pool.queryOne(
      `SELECT id, isactif AS "isActif", retroid AS "retroId", sprintid AS "sprintId", teamid AS "teamId", companyid AS "companyId", isclosed AS "isClosed", isretrodone AS "isRetroDone", isretroinprogress AS "isRetroInProgress" FROM sprintsretrosteams where id = $1`,
      [currentLinkId]
    );
    if (!link) return resultRequest(res, false, 'Lien non trouvé', { });
    
    link.isRetroInProgress = true;
    await pool.query(
      "UPDATE sprintsretrosteams SET isretroinprogress= true WHERE id = $1",
      [currentLinkId]
    );
    resultRequest(res, true, '', link);
  } catch(err) {
    let message = "Erreur lors de la mise à jour du statut du lien";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};