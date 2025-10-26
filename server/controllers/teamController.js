const { readJson, writeJson, addItem, deleteItem } = require('../utils/jsonFileHelper');
const path = require('path');
const { DATA_DIR } = require('../config');
const TEAM_FILE = path.join(DATA_DIR, 'teams.json');
const RETRO_FILE = path.join(DATA_DIR, 'retros.json');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const COMPANY_FILE = path.join(DATA_DIR, 'companies.json');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    const allTeams = await readJson(TEAM_FILE);
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const teams = allTeams.filter(t => t.companyId === req.user.companyId);
    resultRequest(res, true, '', teams);
  } catch (err) {
    resultRequest(res, false, 'Erreur lors de la récupération des équipes', { });
  }
};

exports.getAllWithMembers = async (req, res) => {
  try {    
    const allTeams = await readJson(TEAM_FILE);
    const members = await readJson(MEMBER_FILE);

    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const teams = allTeams.filter(t => t.companyId === req.user.companyId);
    const companies = await readJson(COMPANY_FILE);
    const companylevel = companies[companies.findIndex(c => c.id === req.user.companyId)].subscriptionLevel;
    const teamsRemaining = companylevel !== "2" ? 0 : 1;
    const result = { teamsRemaining, teams : teams.map(team => ({
      ...team,      
      members: members.filter(m => m.teamId === team.id).map(m => ({ name: m.name, trigramme: m.trigramme }))
    }))};
    resultRequest(res, true, '', result);
  } catch (err) {
    resultRequest(res, false, 'Erreur lors de la récupération des équipes', { });
  }
};

exports.create = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const { name } = req.body;
    if (!name) return resultRequest(res, false, 'Nom obligatoire', { });
    const teams = await readJson(TEAM_FILE);
    const index = teams.findIndex(t => t.name === name && t.companyId === req.user.companyId);
    if (index !== -1) return resultRequest(res, false, 'Une équipe porte déjà ce nom', { });
    
    const newTeam = { id: crypto.randomUUID(), name, companyId: req.user.companyId };
    await addItem(TEAM_FILE, newTeam);
    resultRequest(res, true, '', newTeam);
  }catch(err){
    resultRequest(res, false, "Erreur lors de la création de l'équipe", { });
  }
};

exports.update = async (req, res) => {
  try{
    const updatedTeam = req.body;
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const teams = await readJson(TEAM_FILE);
    const index = teams.findIndex(t => t.id === req.params.id);
    if (index === -1) return resultRequest(res, false, 'Équipe non trouvée', { });
    
    teams[index].name = updatedTeam.name;
    await writeJson(TEAM_FILE, teams);
    resultRequest(res, true, '', teams[index]);
  }catch(err){
    resultRequest(res, false, "Erreur lors de la mise à jour de l'équipe", { });
  }
};

exports.remove = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const members = await readJson(MEMBER_FILE);
    const hasMembers = members.some(m => m.teamId === req.params.id);
    
    if (hasMembers) return resultRequest(res, false, 'Impossible de supprimer une équipe avec des membres', { });
    
    await deleteItem(TEAM_FILE, req.params.id);
    resultRequest(res, true, '', { });
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la suppression des équipes', { });
  }
};
