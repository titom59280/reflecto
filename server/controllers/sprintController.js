const { readJson, writeJson, addItem, deleteItem } = require('../utils/jsonFileHelper');
const path = require('path');
const { DATA_DIR } = require('../config');
const SPRINT_FILE = path.join(DATA_DIR, 'sprints.json');
const LINK_FILE = path.join(DATA_DIR, 'sprints-retros-teams.json');
const POSTIT_FILE = path.join(DATA_DIR, 'postits.json');
const COMPANY_FILE = path.join(DATA_DIR, 'companies.json');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const crypto = require('crypto');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const allSprints = await readJson(SPRINT_FILE);
    const sprints = allSprints.filter(s => s.companyId === req.user.companyId);
    resultRequest(res, true, '', sprints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la récupération des sprints', { });
  }
};

exports.create = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const { name, isActive = false, isClosed = false, isRetroDone = false } = req.body;
    if (!name) return resultRequest(res, false, 'Nom obligatoire', { });
    const companies = await readJson(COMPANY_FILE);
    
    const indexCompany = companies.findIndex(m => m.id === req.user.companyId);
    if (indexCompany === -1) return resultRequest(res, false, 'Compagnie non trouvé', { });
    
    const newSprint = {
      id: crypto.randomUUID(),
      name,
      isActive,
      companyId: req.user.companyId,
      isClosed,
      isRetroDone,
      createdAt: new Date().toISOString()
    };
    
    await addItem(SPRINT_FILE, newSprint);
    resultRequest(res, true, '', newSprint);
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la création du sprint', { });
  }
};

exports.remove = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const links = await readJson(LINK_FILE);
    const postits = await readJson(POSTIT_FILE);
    
    const linked = links.filter(l => l.sprintId === req.params.id);
    const allClosed = linked.every(l => l.isClosed);
    
    if (!allClosed) return resultRequest(res, false, 'Une rétro liée est encore active', { });
    
    await deleteItem(SPRINT_FILE, req.params.id);
    
    const updatedLinks = links.filter(l => l.sprintId !== req.params.id);
    const updatedPostits = postits.filter(p => !linked.find(l => l.id === p.linkId));
    await writeJson(LINK_FILE, updatedLinks);
    await writeJson(POSTIT_FILE, updatedPostits);
    
    resultRequest(res, true, '', { });
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la suppression du sprint', { });
  }
};
