const { readJson, writeJson, addItem, deleteItem } = require('../utils/jsonFileHelper');
const path = require('path');
const { DATA_DIR } = require('../config');
const POSTIT_FILE = path.join(DATA_DIR, 'postits.json');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getMine = async (req, res) => {
  try{
    const linkId = req.params.linkId;
    const userId = req.user?.id;
    const all = await readJson(POSTIT_FILE);
    const mine = all.filter(p => p.sprintRetroTeamLinkId === linkId && p.memberId === userId);
    resultRequest(res, true, '', mine);
  } catch (e) {
    resultRequest(res, false, "Erreur lors de la récupération de vos post-its", { });
  }
};

exports.getAllByLink = async (req, res) => {
  try{
    const linkId = req.params.linkId;
    const all = await readJson(POSTIT_FILE);
    resultRequest(res, true, '', all.filter(p => p.sprintRetroTeamLinkId === linkId));
  } catch (e) {
    resultRequest(res, false, "Erreur lors de la récupération des post-its du sprint en cours", { });
  }
};

exports.create = async (req, res) => {
  try{
    const { message, categoryName,sprintRetroTeamLinkId } = req.body;

    if (!message || !categoryName || !sprintRetroTeamLinkId) return resultRequest(res, false, 'Champs requis manquants', { });

    const members = await readJson(MEMBER_FILE);
    const indexMember = members.findIndex(p => p.id === req.user?.id);
    
    if (indexMember === -1) return resultRequest(res, false, 'Membre introuvable', { });

    const newPostit = {
      id: crypto.randomUUID(),
      message,
      categoryName,
      sprintRetroTeamLinkId,
      trigramme: members[indexMember].trigramme,
      memberId: req.user?.id,
      annotation: ''
    };

    await addItem(POSTIT_FILE, newPostit);
    resultRequest(res, true, newPostit);
  } catch (error) {
    resultRequest(res, false, 'Erreur lors de la création du post-it', { });
  }
};

exports.update = async (req, res) => {
  try{
    const { id, message, categoryName, annotation } = req.body;
    const postits = await readJson(POSTIT_FILE);
    const index = postits.findIndex(p => p.id === id);
    if (index === -1) return resultRequest(res, false, 'Post-it introuvable', { });

    postits[index].categoryName = categoryName?? postits[index].categoryName;
    postits[index].message = message ?? postits[index].message;
    postits[index].annotation = annotation ?? postits[index].annotation;

    await writeJson(POSTIT_FILE, postits);
    resultRequest(res, true, postits[index]);
  } catch (error) {
    resultRequest(res, false, 'Erreur lors de la mise à jour du post-it',  { });
  }
};

exports.remove = async (req, res) => {
  try{
    await deleteItem(POSTIT_FILE, req.params.id);
    resultRequest(res, true, '', { });
  } catch (error) {
    resultRequest(res, false, 'Erreur lors de la suppression du post-it', { });
  }
};
