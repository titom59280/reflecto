const { readJson, writeJson, addItem, deleteItem } = require('../utils/jsonFileHelper');
const crypto = require('crypto');
const path = require('path');
const { DATA_DIR } = require('../config');
const LINK_FILE = path.join(DATA_DIR, 'sprints-retros-teams.json');
const SPRINT_FILE = path.join(DATA_DIR, 'sprints.json');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const TEAM_FILE = path.join(DATA_DIR, 'teams.json');
const RETRO_FILE = path.join(DATA_DIR, 'retros.json');
const { resultRequest } = require('../utils/requestUtils');

exports.getAll = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const allLinks = await readJson(LINK_FILE);
    const links = allLinks.filter(l => l.companyId === req.user.companyId);
    resultRequest(res, true, '', links);
  }catch(err){
    resultRequest(res, false, 'Erreur lors de la récupération des liens rétro-sprint', { });
  }
};

exports.getForUser = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const userId = req.params.userId;
    const [sprints, users, retros, teams, links] = await Promise.all([
      readJson(SPRINT_FILE),
      readJson(MEMBER_FILE),
      readJson(RETRO_FILE),
      readJson(TEAM_FILE),
      readJson(LINK_FILE),
    ]);
    
    
    const result = links
        .filter(link => link.teamId === req.user.teamId && !link.isRetroDone && !link.isClosed)
        .map(link => {
          const team = teams.find(t => t.id === link.teamId);
          const retro = retros.find(r => r.id === link.retroId);
          const sprint = sprints.find(s => s.id === link.sprintId);
          return {
            ...link,
            teamName: team?.name,
            retroName: retro?.name,
            sprintName: sprint?.name
          };
        });
    resultRequest(res, true, '', result);
  } catch(err) {
    resultRequest(res, false, 'Erreur lors de la récupération des liens rétro-sprint', { });
  }
};

exports.getForTeam = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null) return resultRequest(res, false, 'Methode non accessible', { });
    const teamId = req.params.teamId;
    const [sprints,retros, teams, links] = await Promise.all([
      readJson(SPRINT_FILE),
      readJson(RETRO_FILE),
      readJson(TEAM_FILE),
      readJson(LINK_FILE),
    ]);
    
    const team = teams.find(u => u.id === teamId);
    if (!team) return resultRequest(res, false, 'Équipe non trouvé', { });

    const result = links
      .filter(link => link.teamId === teamId && !link.isRetroDone && !link.isClosed)
      .map(link => {
        const team = teams.find(t => t.id === link.teamId);
        const retro = retros.find(r => r.id === link.retroId);
        const sprint = sprints.find(s => s.id === link.sprintId);
        return {
          ...link,
          teamName: team?.name,
          retroName: retro?.name,
          sprintName: sprint?.name
        };
      });
    resultRequest(res, true, '', result);
  } catch(err) {
    resultRequest(res, false, 'Erreur lors de la récupération des liens rétro-sprint', { });
  }
};

exports.create = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { retroId, sprintId, teamId } = req.body;
    if (!sprintId || !retroId || !teamId) {
      return resultRequest(res, false, "identifiants du sprint de la rétro et de l'équipe sont requis", { });
    }

    const [sprints, retros, teams, links] = await Promise.all([
      readJson(SPRINT_FILE),
      readJson(RETRO_FILE),
      readJson(TEAM_FILE),
      readJson(LINK_FILE),
    ]);
    
    const sprint = sprints.find(s => s.id === sprintId);
    const retro = retros.find(r => r.id === retroId);
    const team = teams.find(t => t.id === teamId);

    if (!sprint || !retro || !team) return resultRequest(res, false, 'Sprint, rétro ou équipe introuvable', { });

    const exists = links.some(l => l.retroId === retroId && l.sprintId === sprintId && l.teamId === teamId);
    if (exists) return resultRequest(res, false, 'Une rétro est déjà associée à ce sprint pour cette équipe.', { });

    const newLink = {
      id: crypto.randomUUID(),
      retroId,
      sprintId,
      teamId,
      companyId: req.user.companyId,
      isActif: false,
      isClosed: false,
      isRetroInProgress: false,
      isRetroDone: false,
    };

    await addItem(LINK_FILE, newLink);
    resultRequest(res, true, '', newLink);
  } catch {
    resultRequest(res, false, 'Erreur de la création du lien rétro-sprint', { newLink });
  }
};

exports.remove = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const id = req.params.id;
    const [links] = await Promise.all([
      readJson(LINK_FILE),
    ]);

    const link = links.find(l => l.id === id);
    if (!link) return resultRequest(res, false, 'Lien non trouvé', { });
    
    if (link?.isRetroDone) return resultRequest(res, false, 'Impossible de supprimer un lien rétro associée à un sprint terminé', { });

    await deleteItem(LINK_FILE, req.params.id);
    resultRequest(res, true, '', { });
  } catch {
    resultRequest(res, false, 'Erreur de la suppression du lien rétro-sprint',  { });
  }
};

exports.getNextSprintName = async(req, res) =>{
  try {    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const teamId = req.params.teamId;
    const currentLinkId = req.params.currentLinkId;

    const links = await readJson(LINK_FILE);
    const sprints = await readJson(SPRINT_FILE);
    const index = links.findIndex(l => l.id === currentLinkId);
    if (index === -1) return resultRequest(res, false, 'Lien non trouvé', { });

    const currentSprintId = links[index].sprintId;

    const nextSprintIndex = sprints.findIndex(s => s.id !== currentSprintId && !s.isClosed);
    let result = undefined;
    let indexNextLink = 0
    if(nextSprintIndex !== -1){
      indexNextLink = links.findIndex(l => l.sprintId === sprints[nextSprintIndex].id && l.teamId == teamId);
    }
  
    if(indexNextLink > 0){
      result = sprints[nextSprintIndex]
    }
    
    resultRequest(res, true, '', result);
  } catch (e) {
    resultRequest(res, false, "Erreur lors de la récupération du nom du prochain sprint", { });
  }
};

exports.markRetroDone = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { currentLinkId, nextSprintId, teamId } = req.body;
    const links = await readJson(LINK_FILE);
    const sprints = await readJson(SPRINT_FILE);
    const index = links.findIndex(la => la.id === currentLinkId);
    if (index === -1) return resultRequest(res, false, 'Lien non trouvé', { });
  
    const sprintIndex = sprints.findIndex(s => s.id === links[index].sprintId);
    if (sprintIndex === -1) return resultRequest(res, false, 'sprint non trouvé', { });
    links[index].isRetroDone = true;
    links[index].isRetroInProgress = false;
    links[index].isActif = false;
    const linksInProgressForSprint = links.find(lb => lb.sprintId === sprints[sprintIndex].id && !lb.isRetroDone)
    
    if(!linksInProgressForSprint || linksInProgressForSprint.length === 0){
      sprints[sprintIndex].isClosed = true;
      await writeJson(SPRINT_FILE, sprints);    
    }
    
    if(nextSprintId){
      const indexNextLink = links.findIndex(lc => lc.sprintId === nextSprintId && lc.teamId === teamId);
      if (indexNextLink === -1) return resultRequest(res, false, 'Lien non trouvé pour le prochain sprint', { });

      links[indexNextLink].isActif = true;
    }

    await writeJson(LINK_FILE, links);
    resultRequest(res, true, '', links[index]);
  } catch (e) {
    resultRequest(res, false, 'Erreur lors de la mise à jour du statut du lien',{ });
  }
};

exports.markClosed = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { currentLinkId } = req.body;
    const links = await readJson(LINK_FILE);
    const index = links.findIndex(l => l.id === currentLinkId);
    if (index === -1) return resultRequest(res, false, 'Lien non trouvé', { });

    links[index].isClosed= true;
    await writeJson(LINK_FILE, links);
    resultRequest(res, true, '', { });
  } catch (e) {
    resultRequest(res, false, 'Erreur lors de la mise à jour du statut du lien', { });
  }
};

exports.activate = async (req, res) => {
  try{    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { linkId } = req.body;
    const links = await readJson(LINK_FILE);
    const index = links.findIndex(l => l.id === linkId);
    if (index === -1) return resultRequest(res, false, 'Lien non trouvé', { });

    const indexAciveRetro = links.findIndex(l => l.teamId === links[index].teamId && l.isActif);
    if (indexAciveRetro !== -1) return resultRequest(res, false, 'Il y a déjà une rétro active pour cette équipe', { });

    links[index].isActif= true;
    await writeJson(LINK_FILE, links);
    resultRequest(res, true, '', { });
  }catch(err){
    resultRequest(res, false, "Erreur lors de l'activation de la rétro", { });
  }
};

exports.markRetroStart = async (req, res) => {
  try {    
    if (req.user === undefined || req.user === null || !req.user.isScrumMaster) return resultRequest(res, false, 'Methode non accessible', { });
    const { currentLinkId } = req.body;
    const links = await readJson(LINK_FILE);

    const index = links.findIndex(l => l.id === currentLinkId);
    if (index === -1) return resultRequest(res, false, 'Lien non trouvé', { });

    links[index].isRetroInProgress = true;

    await writeJson(LINK_FILE, links);
    resultRequest(res, true, '', links[index]);
  } catch (e) {
    resultRequest(res, false, 'Erreur lors de la mise à jour du statut du lien', { });
  }
};