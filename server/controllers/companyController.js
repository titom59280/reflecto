const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { createMember } = require('../utils/memberUtils');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    const companies = await pool.query(
      `SELECT id, name, subscriptionlevel AS "subscriptionLevel" FROM companies`,
      []
    );
    resultRequest(res, true, '', companies);
  }catch(err){
    let message = "Erreur lors de la récupération des entreprises";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.getCompanieForUser = async (req, res) => {
  try{
    const companie = await pool.queryOne(
      `SELECT id, name, subscriptionlevel AS "subscriptionLevel" FROM companies where id = $1`,
      [req.user.companyId]
    );
    resultRequest(res, true, '', companie);
  }catch(err){
    let message = "Erreur lors de la récupération de l'entreprise";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.create = async (req, res) => {
  try{
    const { companyName, scrumMasterEmail, scrumMasterName, scrumMasterTrigramme, subscriptionLevel, teamName } = req.body;
    if (!companyName || !scrumMasterEmail || !scrumMasterName || !scrumMasterTrigramme || !teamName) {
      return resultRequest(res, false, "informations entreprise équipe ou scrumMaster manquantes.", { });
    }
    let subscriptionLevelCompany = "0";

    if (subscriptionLevel) {
      subscriptionLevelCompany = subscriptionLevel;
    }

    const company = await pool.queryOne(
      "SELECT * FROM companies WHERE name = $1",
      [companyName]
    );
    if (company) return resultRequest(res, false, 'Une entreprise avec ce nom existe déjà', { });
    
    const idCompany = crypto.randomUUID();
    const idTeam = crypto.randomUUID();
    const newCompany = {
      id: idCompany,
      name: companyName,
      subscriptionLevel: subscriptionLevelCompany
    };

    await pool.query(
      "INSERT INTO companies (id, name, subscriptionlevel) VALUES ($1, $2, $3)",
      [idCompany, companyName, subscriptionLevelCompany]
    );

    const datas = {
      companyId: idCompany,
      email: scrumMasterEmail,
      teamId: idTeam,
      name: scrumMasterName,
      trigramme: scrumMasterTrigramme,
      isScrumMaster: true
    };

    const team = await pool.queryOne(
      "SELECT * FROM teams WHERE name = $1",
      [teamName]
    );
    if (team) return resultRequest(res, false, 'Une équipe porte déjà ce nom', { });

    await pool.query(
      "INSERT INTO teams (id, companyid, name) VALUES ($1, $2, $3)",
      [idTeam, idCompany,  teamName]
    );
    
    
    const result = await createMember(datas);

    if (!result.success) {
      await pool.query(
        "DELETE FROM teams where id = $1",
        [idTeam]
      );

      await pool.query(
        "DELETE FROM companies where id = $1",
        [idCompany]
      );


      resultRequest(res, false, result.message, { datas });
      return;
    }
    
    resultRequest(res, true, "Inscription effectuée, le scrum Master peut désormais s'inscrire à son tour", newCompany);
  } catch(err) {
    let message = "Erreur lors de la création de la compagnie";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, err.message, {});
  }
};

exports.update = async (req, res) => {
  try{
    const { companyId, companyName, subscriptionLevel } = req.body;
    if (!companyId || !companyName || !subscriptionLevel) {
      return resultRequest(res, false, "informations entreprise ou niveau manquantes.", { });
    }

    const company = await pool.queryOne(
      `SELECT id, name, subscriptionlevel AS "subscriptionLevel" FROM companies where id = $1`,
      [companyId]
    );
    if (!company) return resultRequest(res, false, 'Compagnie non trouvée', { });
    
    company.subscriptionLevel = subscriptionLevel;
    await pool.query(
      "UPDATE companies SET subscriptionlevel = $1",
      [subscriptionLevel]
    );
    resultRequest(res, true, '', company);
  } catch(err) {
    let message = "Erreur de la mise a jour de la compagnie";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.remove = async (req, res) => {
  try{
    const id = req.params.id;
    await pool.query(
      "DELETE FROM companies WHERE id = $1",
      [id]
    );
    resultRequest(res, true, '', { });
  } catch(err) {
    let message = "Erreur de la suppression de la compagnie";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};
