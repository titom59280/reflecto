const { readJson, writeJson } = require('../utils/jsonFileHelper');
const nodemailer = require('nodemailer');
const path = require('path');
const { DATA_DIR } = require('../config');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const TEAM_FILE = path.join(DATA_DIR, 'teams.json');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateToken } = require('../utils/tokenUtils');
const { resultRequest } = require('../utils/requestUtils');
const MAIL_PASS = process.env.MAIL_PASS;
const MAIL_USER = process.env.MAIL_USER;
const MAIL_RECEIVER = process.env.MAIL_RECEIVER;
exports.contact = async (req, res) => {
  try{

    const { name, email, message } = req.body;

    // Vérification basique
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    // Configuration du transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // ex : smtp.gmail.com
      port: 587,
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: MAIL_USER, // depuis .env
        pass: MAIL_PASS
      }
    });

    // Contenu de l'email
    const mailOptions = {
      from: `"Contact Reflecto" <${MAIL_USER}>`,
      to: MAIL_RECEIVER || 'support@reflecto.com', // destinataire
      subject: `Nouveau message de contact - ${name}`,
      text: `
Nom : ${name}
Email : ${email}
Message :
${message}
      `,
      html: `
        <h3>Nouveau message de contact</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Message :</strong><br>${message}</p>
      `
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    resultRequest(res, true, 'Message envoyé', { });
  }catch(err){
    
    resultRequest(res, false, "Erreur lors de l'envoi du message", { });
  }
}

exports.login = async (req, res) => {
  try{

    const { email, password } = req.body;
    if (!email || !password) return resultRequest(res, false, 'Champs requis');
    
    const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    const members = await readJson(MEMBER_FILE);
    const user = members.find(m => m.email === hashedEmail);
    
    if (!user || !user.password) return resultRequest(res, false, 'Identifiants invalides');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) return resultRequest(res, false, 'Identifiants invalides');
    
    if(!user.teamId && !user.isScrumMaster) {
      return resultRequest(res, false, 'Aucune équipe affectée. Rapprochez vous de votre Scrum Master');
    }
    
    const teams = await readJson(TEAM_FILE);
    const indexTeams = teams.findIndex(team => team.id === user.teamId);
    const team = { team: teams[indexTeams] };
    
    
    const token = generateToken(user);
    resultRequest(res, true, '', { user: { ...user, password: undefined, team: team }, token });
  }catch(err){
    resultRequest(res, false, "Erreur lors de l'authentification", { });
  }
};