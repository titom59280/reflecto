const pool = require('../utils/dbHelper');
const { createMember } = require('../utils/memberUtils');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateToken } = require('../utils/tokenUtils');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
   if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { }, 'METHOD_NOT_ALLOWED');
    
    const members = await pool.query(
      `SELECT id, name, email, trigramme, isscrummaster as "isScrumMaster", isfulladmin as "isFullAdmin", teamid as "teamId", companyid as "companyId" FROM members WHERE companyId = $1`,
      [req.user.companyId]
    );
    const company = await pool.queryOne(
      "SELECT subscriptionlevel FROM companies WHERE id = $1",
      [req.user.companyId]
    );
    const subscriptionLevel = company.subscriptionlevel;
    const membersRemaining = subscriptionLevel === '0' ? members.length < 3 ? 1 : 0 : subscriptionLevel === '1' ? members.length < 5 ? 1 : 0 : 1;      
    const result = {
      members,
      membersRemaining
    };
    resultRequest(res, true, '', result);
  } catch (err) {
    let message = "Erreur lors de la lecture des membres";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, err, 'MEMBERS_FETCH_ERROR');
  }
};

exports.create = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { }, 'METHOD_NOT_ALLOWED');
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
      resultRequest(res, false, result.message, { test: datas }, result.code);
      return;
    }

    resultRequest(res, true, '', result.result);
  }catch(err){
    let message = "Erreur lors de la création du membre";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { }, 'MEMBER_CREATE_ERROR');
  }
};

exports.chooseColorPostIt = async (req, res) => {
  try{
    const member = await pool.queryOne(
      "SELECT * FROM members WHERE id = $1",
      [req.user?.id]
    );
    if (!member) return resultRequest(res, false, 'Membre introuvable', {  user: req.user }, 'MEMBER_NOT_FOUND');

    const { color } = req.body;
    await pool.query('UPDATE members SET color = $1 WHERE id = $2', [color, req.user.id]);

    resultRequest(res, true, color);
  }catch (err) {
    let message = "Erreur lors de la sélection de la couleur";
    if(process.env.LOG_STATUS == "all") {
      message = err.message;
    }
    resultRequest(res, false, message, { }, 'COLOR_UPDATE_ERROR');
  }
}

exports.update = async (req, res) => {
  try{
    const id = req.params.id;
    const updatedFields = req.body;
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { }, 'METHOD_NOT_ALLOWED');
    
    const user = await pool.queryOne(
      `SELECT id, name, email, trigramme, isscrummaster as "isScrumMaster", isfulladmin as "isFullAdmin", teamid as "teamId", companyid as "companyId"  FROM members WHERE id = $1`,
      [id]
    );
    if (!user) return resultRequest(res, false, 'Membre introuvable', { }, 'MEMBER_NOT_FOUND');
    
    user.email = updatedFields.email;
    user.trigramme = updatedFields.trigramme;
    user.name = updatedFields.name;
    user.isScrumMaster = updatedFields.isScrumMaster;
    user.teamId = updatedFields.teamId;
    await pool.query(
      "UPDATE members set email = $1, name = $2, trigramme = $3, isscrummaster = $4, teamid = $5 WHERE id = $6",
      [user.email, user.name, user.trigramme, user.isScrumMaster, user.teamId, id]
    );
    user.password = undefined;
    resultRequest(res, true, '', user);
  } catch (err) {
    let message = "Erreur lors de la modification du membres";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { }, 'MEMBER_UPDATE_ERROR');
  }
};

exports.remove = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { }, 'METHOD_NOT_ALLOWED');
    const id = req.params.id;
    await pool.query(
      "DELETE FROM members WHERE id = $1",
      [id]
    );
    res.json({ success: true });
    resultRequest(res, true, '', { });
  } catch(err){
    let message = "Erreur lors de la suppression du membre";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { }, 'MEMBER_DELETE_ERROR');
  }
};


exports.checkEmail = async (req, res) => {
  try{

    const { email, forCompagnie } = req.body;
    
    const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const user = await pool.queryOne(
      "SELECT * FROM members WHERE email = $1",
      [hashedEmail]
    );
    
    if (!forCompagnie && !user) return resultRequest(res, false, 'Adresse non reconnue. Veuillez contacter votre Scrum Master', { }, 'EMAIL_NOT_RECOGNIZED');
    if (forCompagnie && user) return resultRequest(res, false, 'Adresse déjà inscrite. Veuillez entrer une nouvelle adresse email', { }, 'EMAIL_ALREADY_REGISTERED_NEW');

    if(forCompagnie && !user) return resultRequest(res, true, '', { });
    const alreadyRegister = !!user.password;
    if (alreadyRegister) {
      return resultRequest(res, false, 'Adresse déjà inscrite. Veuillez vous connecter.', { }, 'EMAIL_ALREADY_REGISTERED_LOGIN');
    }
    resultRequest(res, true, '', { });
  }catch(err){
    let message = "Erreur lors de la vérification de l'email";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { }, 'EMAIL_CHECK_ERROR');
  }
};

exports.updatePassword = async (req, res) => {
  try{

    const { email, password } = req.body;
    
    if (!email || !password || password.length < 6) {
      return resultRequest(res, false, 'Email et mot de passe (6+ caractères) requis', { }, 'EMAIL_PASSWORD_REQUIRED');
    }
    const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');    
    const user = await pool.queryOne(
      `SELECT id, name, email, trigramme, isscrummaster as "isScrumMaster", isfulladmin as "isFullAdmin", teamid as "teamId", companyid as "companyId"  FROM members WHERE email = $1`,
      [hashedEmail]
    );
    if (!user) return resultRequest(res, false, 'Utilisateur non trouvé', { }, 'USER_NOT_FOUND');
    
    user.password = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE members SET password = $1 WHERE id = $2",
      [user.password, user.id]
    );

    const team  = await pool.queryOne(
      `SELECT id, name, companyid as "companyId" FROM teams WHERE id = $1`,
      [user.teamId]
    );

    const token = generateToken(user);
    resultRequest(res, true, '', { user: { ...user, password: undefined, team: team }, token });
  }catch(err){
    let message = "Erreur lors de la mise à jour du mot de passe";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { }, 'PASSWORD_UPDATE_ERROR');
  }
};
