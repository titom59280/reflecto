const pool = require('../utils/dbHelper');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getMine = async (req, res) => {
  try{
    const postits = await pool.query(
      `SELECT id, message, categoryname as "categoryName", sprintretroteamlinkid as "sprintRetroTeamLinkId", trigramme, color, memberid as "memberId", annotation FROM postits WHERE sprintretroteamlinkid = $1 AND memberid = $2`,
      [req.params.linkId, req.user?.id]
    );
    resultRequest(res, true, '', postits);
  } catch (err) {
    let message = "Erreur lors de la récupération de vos post-its";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.getAllByLink = async (req, res) => {
  try{
    const postits = await pool.query(
      `SELECT id, message, categoryname as "categoryName", sprintretroteamlinkid as "sprintRetroTeamLinkId", trigramme, color, memberid as "memberId", annotation FROM postits WHERE sprintretroteamlinkid = $1`,
      [req.params.linkId]
    );
    
    resultRequest(res, true, '', postits);
  } catch (err) {
    let message = "Erreur lors de la récupération des post-its du sprint en cours";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.create = async (req, res) => {
  try{
    const { message, categoryName,sprintRetroTeamLinkId } = req.body;

    if (!message || !categoryName || !sprintRetroTeamLinkId) return resultRequest(res, false, 'Champs requis manquants', { });

    const member = await pool.queryOne(
      "SELECT * FROM members WHERE id = $1",
      [req.user?.id]
    );
    if (!member) return resultRequest(res, false, 'Membre introuvable', { });

    const newPostit = {
      id: crypto.randomUUID(),
      message,
      categoryName,
      sprintRetroTeamLinkId,
      trigramme: member.trigramme,
      color: member.color,
      memberId: req.user?.id,
      annotation: ''
    };
    await pool.query(
      "INSERT INTO postits (id, message, categoryname, sprintretroteamlinkid, trigramme, memberid, annotation, color) VALUES ($1, $2, $3, $4, $5, $6, '', $7)",
      [newPostit.id, message, categoryName, sprintRetroTeamLinkId, member.trigramme, member.id, member.color]
    );
    resultRequest(res, true, newPostit);
  } catch (err) {
    let message = "Erreur lors de la création du post-it";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};

exports.update = async (req, res) => {
  try{
    const { id, message, categoryName, annotation } = req.body;
    const postIt = await pool.queryOne(
      `SELECT id, message, categoryname as "categoryName", sprintretroteamlinkid as "sprintRetroTeamLinkId", trigramme, memberid as "memberId", annotation FROM postits WHERE id = $1`,
      [id]
    );
    if (!postIt) return resultRequest(res, false, 'Post-it introuvable', { });

    postIt.categoryName = categoryName;
    postIt.message = message ?? postIt.message;
    postIt.annotation = annotation ?? postIt.annotation;

    await pool.query(
      "UPDATE postits SET categoryname = $1, message = $2, annotation = $3 WHERE id = $4",
      [categoryName, message, annotation, id]
    );
    resultRequest(res, true, postIt);
  } catch (err) {
    let message = "Erreur lors de la mise à jour du post-it";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message,  { });
  }
};

exports.remove = async (req, res) => {
  try{
    await pool.query(
      "DELETE FROM postits WHERE id = $1",
      [req.params.id]
    );
    resultRequest(res, true, '', { });
  } catch (err) {
    let message = "Erreur lors de la suppression du post-it";
    if (process.env.LOG_STATUS == "all"){
      message = err.message;
    }
    resultRequest(res, false, message, { });
  }
};
