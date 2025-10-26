const { readJson, writeJson, addItem, deleteItem } = require('../utils/jsonFileHelper');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('../config');
const COMPANY_FILE = path.join(DATA_DIR, 'companies.json');
const TEAM_FILE = path.join(DATA_DIR, 'teams.json');
const { createMember } = require('../utils/memberUtils');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    const companies = await readJson(COMPANY_FILE);
    resultRequest(res, true, '', companies);
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la récupération des entreprises', { });
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

    const companies = await readJson(COMPANY_FILE);
    const indexCompany = companies.findIndex(c => c.name === companyName);
    if (indexCompany !== -1) return resultRequest(res, false, 'Une entreprise avec ce nom existe déjà', { });
    
    const idCompany = crypto.randomUUID();
    const idTeam = crypto.randomUUID();
    const newCompany = {
      id: idCompany,
      name: companyName,
      subscriptionLevel: subscriptionLevelCompany
    };
    await addItem(COMPANY_FILE, newCompany);
    const datas = {
      companyId: idCompany,
      email: scrumMasterEmail,
      teamId: idTeam,
      name: scrumMasterName,
      trigramme: scrumMasterTrigramme,
      isScrumMaster: true
    };

    const teams = await readJson(TEAM_FILE);
    const index = teams.findIndex(t => t.name === teamName && t.companyId === idCompany);
    if (index !== -1) return resultRequest(res, false, 'Une équipe porte déjà ce nom', { });
    
    const newTeam = { id: idTeam, teamName, companyId: idCompany };
    await addItem(TEAM_FILE, newTeam);

    const result = await createMember(datas);

    if (!result.success) {
      await deleteItem(COMPANY_FILE, idCompany);
      resultRequest(res, false, result.message, { datas });
      return;
    }
    
    resultRequest(res, true, "Inscription effectuée, le scrum Master peut désormais s'inscrire à son tour", newCompany);
  } catch(err) {
    resultRequest(res, false, 'Erreur lors de la création de la compagnie', {});
  }
};

exports.update = async (req, res) => {
  try{
    const { companyId, companyName, subscriptionLevel } = req.body;
    if (!companyId || !companyName || !subscriptionLevel) {
      return resultRequest(res, false, "informations entreprise ou niveau manquantes.", { });
    }

    const companies = await readJson(COMPANY_FILE);
    const indexCompany = companies.findIndex(c => c.id === companyId);
    if (indexCompany === -1) return resultRequest(res, false, 'Compagnie non trouvée', { });
    
    companies[indexCompany].name = companyName;
    companies[indexCompany].subscriptionLevel = subscriptionLevel;
    await writeJson(COMPANY_FILE, companies);
    resultRequest(res, true, '', companies[indexCompany]);
  } catch {
    resultRequest(res, false, "Erreur de la création de la compagnie", { });
  }
};

exports.remove = async (req, res) => {
  try{
    const id = req.params.id;
    await deleteItem(COMPANY_FILE, id);
    resultRequest(res, true, '', { });
  } catch {
    resultRequest(res, false, 'Compagnie introuvable', { });
  }
};
