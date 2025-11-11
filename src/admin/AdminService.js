// client/src/admin/AdminService.js
//-----------------------------------------------------------
//  Service d’administration – appels API vers le backend
//-----------------------------------------------------------
import authService from '@/services/authService';
export default {
  async getTeams() {
    const res = await authService.instance.get(`/teams`);
    return res.data;
  },
  async getTeamsWithMembers() {
    const res = await authService.instance.get(`/teams/with-members`);
    return res.data;
  },
  async createTeam(name) {
    const res = await authService.instance.post(`/teams`, { name });
    return res.data;
  },
  async updateTeam(team) {
    const res = await authService.instance.put(`/teams/${team.id}`, team);
    return res.data;
  },
  async deleteTeam(id) {
    const res = await authService.instance.delete(`/teams/${id}`);
    return res.data;
  },

  // companies
  async getCompanies() {
    const res = await authService.instance.get(`/companies`);
    return res.data;
  },

  async getCompanie() {
    const res = await authService.instance.get(`/companies/getCompanie`);
    return res.data;
  },

  async createCompany(companyName, scrumMasterEmail, scrumMasterName, scrumMasterTrigramme) {
    const res = await authService.instance.post(`/companies`, {
      companyName,
      scrumMasterEmail,
      scrumMasterName,
      scrumMasterTrigramme,
    });
    return res.data;
  },

  async updateCompany(companyId, companyName, subscriptionLevel) {
    const res = await authService.instance.put(`/companies`, {
      companyId,
      companyName,
      subscriptionLevel,
    });
    return res.data;
  },

  async deleteCompany(companyId) {
    const res = await authService.instance.delete(`/companies/${companyId}`);
    return res.data;
  },

  // 👥 Members
  async getMembers() {
    const res = await authService.instance.get(`/members`);
    return res.data;
  },
  async createMember(member) {
    const res = await authService.instance.post(`/members`, member);
    return res.data;
  },
  async deleteMember(id) {
    const res = await authService.instance.delete(`/members/${id}`);
    return res.data;
  },
  async updateMember(member) {
    const res = await authService.instance.put(`/members/${member.id}`, member);
    return res.data;
  },

  // 🏁 Sprint
  async getSprints() {
    const res = await authService.instance.get(`/sprints`);
    return res.data;
  },
  async createSprint(sprint) {
    const res = await authService.instance.post(`/sprints`, sprint);
    return res.data;
  },
  async deleteSprint(id) {
    const res = await authService.instance.delete(`/sprints/${id}`);
    return res.data;
  },
  async activateSprint(linkId) {
    const res = await authService.instance.post(`/sprint-retro-team/activate`, { linkId });
    return res.data;
  },

  // 🏁 Retro
  async getRetros() {
    const res = await authService.instance.get(`/retros`);
    return res.data;
  },
  async getCategories(retroId) {
    const res = await authService.instance.get(`/retros/categories/${retroId}`);
    return res.data;
  },

  async createRetro(retro) {
    const res = await authService.instance.post(`/retros`, retro, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  async deleteRetro(id) {
    const res = await authService.instance.delete(`/retros/${id}`);
    return res.data;
  },

  async closeLinkRetro(currentLinkId) {
    const res = await authService.instance.put(`/sprint-retro-team/mark-closed`, { currentLinkId });
    return res.data;
  },

  async getSprintRetroLinks() {
    const res = await authService.instance.get(`/sprint-retro-team`);
    return res.data;
  },

  async createRetroToSprint(retroId, sprintId, teamId) {
    const res = await authService.instance.post(`/sprint-retro-team`, {
      retroId,
      sprintId,
      teamId,
    });
    return res.data;
  },

  async deleteRetroFromSprint(linkId) {
    const res = await authService.instance.delete(`/sprint-retro-team/${linkId}`);
    return res.data;
  },
};
