const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const teams = await pool.query(
      `SELECT id, name, companyid as "companyId" FROM teams WHERE companyid = $1`,
      [req.user.companyId]
    );
    resultRequest(res, true, '', teams);
  } catch (err) {
    let message = "Erreur lors de la récupération des équipes";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message , { });
  }
};

exports.getAllWithMembers = async (req, res) => {
  try {

    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const teams = await pool.query(
      `SELECT id, name, companyid as "companyId" FROM teams WHERE companyid = $1`,
      [req.user.companyId]
    );

    const company = await pool.queryOne(
      `SELECT id, name, subscriptionlevel as "subscriptionLevel" FROM companies WHERE id = $1`,
      [req.user.companyId]
    );
    
    const companylevel = company.subscriptionLevel;
    const teamsRemaining = companylevel !== "2" ? 0 : 1;
    
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await pool.query(
          "SELECT name, trigramme FROM members WHERE teamid = $1",
          [team.id]
        );

        return {
          ...team,
          members
        };
      })
    );

    const result = { teamsRemaining, teams: teamsWithMembers };
    resultRequest(res, true, '', result);
  } catch (err) {
    let message = "Erreur lors de la récupération des équipes";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.create = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const { name } = req.body;
    if (!name) return resultRequest(res, false, 'Nom obligatoire', { });
    const team = await pool.queryOne(
      "SELECT * FROM teams WHERE name = $1 AND companyid = $2",
      [name, req.user.companyId]
    );
    if (team) return resultRequest(res, false, 'Une équipe porte déjà ce nom', { });
    
    const newTeam = { id: crypto.randomUUID(), name, companyId: req.user.companyId };
    await pool.query(
      "INSERT INTO teams (id, name, companyid) VALUES ($1, $2, $3)",
      [newTeam.id, name, req.user.companyId]
    );
    resultRequest(res, true, '', newTeam);
  }catch(err){
    let message = "Erreur lors de la création de l'équipe";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.update = async (req, res) => {
  try{
    const updatedTeam = req.body;
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const team = await pool.queryOne(
      "SELECT * FROM teams WHERE id = $1",
      [req.params.id]
    );
    if (!team) return resultRequest(res, false, 'Équipe non trouvée', { });
    
    team.name = updatedTeam.name;
    await pool.query(
      "UPDATE teams SET name = $1 WHERE teamid = $2",
      [team.name, req.params.id]
    );
    resultRequest(res, true, '', team);
  }catch(err){
    let message = "Erreur lors de la mise à jour de l'équipe";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.remove = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const members = await pool.query(
      "SELECT * FROM members WHERE teamid = $1",
      [req.params.id]
    );
    if (members.length > 0) return resultRequest(res, false, 'Impossible de supprimer une équipe avec des membres', { });
    
    await pool.query(
      "DELETE FROM teams WHERE id = $1",
      [req.params.id]
    );
    resultRequest(res, true, '', { });
  }catch(err){
    let message = "Erreur lors de la suppression des équipes";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};
