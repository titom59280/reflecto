const { readJson, writeJson, addItem, deleteItem } = require('../utils/jsonFileHelper');
const { createMember } = require('../utils/memberUtils');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('../config');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const TEAM_FILE = path.join(DATA_DIR, 'teams.json');
const COMPANY_FILE = path.join(DATA_DIR, 'companies.json');
const { generateToken } = require('../utils/tokenUtils');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    const allMembers = await readJson(MEMBER_FILE);
   if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    
    const members = allMembers.filter(m => m.companyId === req.user.companyId);
    const companies = await readJson(COMPANY_FILE);
    const subscriptionLevel = companies[companies.findIndex(c => c.id === req.user.companyId)].subscriptionLevel;
    const membersRemaining = subscriptionLevel === '0' ? members.length < 3 ? 1 : 0 : subscriptionLevel === '1' ? members.length < 5 ? 1 : 0 : 1;      
    const result = {
      members,
      membersRemaining
    };
    resultRequest(res, true, '', result);
  } catch (err) {
    resultRequest(res, false, 'Erreur lors de la lecture des membres', err);
  }
};

exports.create = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const datas = {
      companyId: req.user.companyId,
      email: req.body.email,
      name: req.body.name,
      trigramme: req.body.trigramme,
      teamId: req.body.teamId,
      isScrumMaster: req.body.isScrumMaster
    };
    const result = await createMember(datas);
    
    if (!result.success) {
      resultRequest(res, false, result.message, { test: datas });
      return;
    }

    resultRequest(res, true, '', result.result);
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la création du membre', { });
  }
};

exports.update = async (req, res) => {
  try{
    const id = req.params.id;
    const updatedFields = req.body;
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const members = await readJson(MEMBER_FILE);
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return resultRequest(res, false, 'Membre introuvable', { });

    members[index] = { ...members[index], ...updatedFields };
    await writeJson(MEMBER_FILE, members);
    resultRequest(res, true, '', members[index]);
  } catch (err) {
    resultRequest(res, false, 'Erreur lors de la modification du membres', { });
  }
};

exports.remove = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const id = req.params.id;
    await deleteItem(MEMBER_FILE, id);
    res.json({ success: true });
    resultRequest(res, true, '', { });
  } catch {
    resultRequest(res, false, 'Erreur lors de la suppression du membre', { });
  }
};


exports.checkEmail = async (req, res) => {
  try{

    const { email, forCompagnie } = req.body;
    const members = await readJson(MEMBER_FILE);
    const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const user = members.find(m => m.email === hashedEmail);
    
    if (!forCompagnie && !user) return resultRequest(res, false, 'Adresse non reconnue. Veuillez contacter votre Scrum Master', { });
    if (forCompagnie && user) return resultRequest(res, false, 'Adresse déjà inscrite. Veuillez entrer une nouvelle adresse email', { });

    if(forCompagnie && !user) return resultRequest(res, true, '', { });
    const alreadyRegister = !!user.password;
    if (alreadyRegister) {
      return resultRequest(res, false, 'Adresse déjà inscrite. Veuillez vous connecter.', { });
    }
    resultRequest(res, true, '', { });
  }catch(error){
    resultRequest(res, false, "Erreur lors de la vérification de l'email", { });
  }
};

exports.updatePassword = async (req, res) => {
  try{

    const { email, password } = req.body;
    
    if (!email || !password || password.length < 6) {
      return resultRequest(res, false, 'Email et mot de passe (6+ caractères) requis', { });
    }
    const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const members = await readJson(MEMBER_FILE);
    const index = members.findIndex(m => m.email === hashedEmail);
    if (index === -1) return resultRequest(res, false, 'Utilisateur non trouvé', { });
    
    members[index].password = await bcrypt.hash(password, 10);
    await writeJson(MEMBER_FILE, members);

    let team = undefined;
    if(members[index].teamId){
      const teams = await readJson(TEAM_FILE);
      const indexTeams = teams.findIndex(team => team.id === members[index].teamId);
      team = { team: teams[indexTeams] };
    }

    const token =generateToken(members[index]);

    
    resultRequest(res, true, '', { user: { ...members[index], password: undefined, team: team }, token });
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la mise à jour du mot de passe', { });
  }
};
