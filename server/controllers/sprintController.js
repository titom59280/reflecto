const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const sprints = await pool.query(
      `SELECT id, name, isactif as "isActif", companyid as "companyID", isclosed as "isClosed", isretrodone as "isRetroDone", createdat as "createdAt" FROM sprints WHERE companyid = $1 ORDER BY createdat DESC`,
      [req.user.companyId]
    );
    resultRequest(res, true, '', sprints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }catch(err){
    let message = "Erreur lors de la récupération des sprints";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.create = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const { name, isActive = false, isClosed = false, isRetroDone = false } = req.body;
    if (!name) return resultRequest(res, false, 'Nom obligatoire', { });
    const company = await pool.queryOne(
      "SELECT * from companies WHERE id = $1",
      [req.user.companyId]
    )
    if (!company) return resultRequest(res, false, 'Compagnie non trouvé', { });
    
    const newSprint = {
      id: crypto.randomUUID(),
      name,
      isActive,
      companyId: req.user.companyId,
      isClosed,
      isRetroDone,
      createdAt: new Date().toISOString()
    };
    
    await pool.query(
      "INSERT INTO sprints (id, name, isactif, companyid, isclosed, isretrodone, createdat) VALUES ($1, $2, $3, $4, $5, $6,$7)",
      [newSprint.id, name, isActive, req.user.companyId, isClosed, isRetroDone, newSprint.createdAt]
    )
    resultRequest(res, true, '', newSprint);
  }catch(err){
    let message = "Erreur lors de la création du sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.remove = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const notClosedRetro = await pool.query(
      "SELECT * FROM sprintsretrosteams WHERE sprintid = $1 AND isclosed= false",
      [req.params.id]
    );
    if (notClosedRetro) return resultRequest(res, false, 'Une rétro liée est encore active', { });
    
    await pool.query(
      "DELETE FROM postits p USING sprintsretrosteams s WHERE p.sprintretroteamid = s.id AND s.retroid = $1",
      [req.params.id]
    );
    await pool.query(
      "DELETE FROM sprintsretrosteams WHERE sprintid = $1",
      [req.params.id]
    );
    await pool.query(
      "DELETE FROM sprints WHERE id = $1",
      [req.params.id]
    );    
    resultRequest(res, true, '', { });
  }catch(err){
    let message = "Erreur lors de la suppression du sprint";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};
