import authService from './authService';
export default {
  // 🔹 Récupérer tous les post-its
  async getPostitsByLink(linkId) {
    const res = await authService.instance.get(`/postits/all/${linkId}`);
    return res.data;
  },

  // Participation pendant la collecte (Scrum Master) : des chiffres, jamais de contenu
  async getPostitStats(linkId) {
    const res = await authService.instance.get(`/postits/stats/${linkId}`);
    return res.data;
  },

  async getPostitsByUser(linkId) {
    const res = await authService.instance.get(`/postits/me/${linkId}`);
    return res.data;
  },

  // 🔹 Créer un nouveau post-it
  async createPostit({ message, authorId, categoryName, sprintRetroTeamLinkId, isAnonymous }) {
    const res = await authService.instance.post(`/postits`, {
      message,
      authorId,
      categoryName,
      sprintRetroTeamLinkId,
      isAnonymous: !!isAnonymous,
    });
    return res.data;
  },

  async chooseColorPostIt(color) {
    const res = await authService.instance.put(`/members/choose-color`, {
      color,
    });

    return res.data;
  },

  // 🔹 Mettre à jour un post-it
  async updatePostit({ id, message, categoryName, annotation, isAnonymous }) {
    const res = await authService.instance.put(`/postits`, {
      id,
      message,
      categoryName,
      annotation,
      isAnonymous,
    });
    return res.data;
  },

  async startRetro(currentLinkId) {
    const res = await authService.instance.put(`/sprint-retro-team/StartRetro`, { currentLinkId });
    return res.data;
  },

  async finishRetro(currentLinkId, nextSprintId, teamId) {
    const res = await authService.instance.put(`/sprint-retro-team/mark-retro-done`, {
      currentLinkId,
      nextSprintId,
      teamId,
    });
    return res.data;
  },

  async getSprints() {
    const res = await authService.instance.get(`/sprints`);
    return res.data;
  },

  // 🔹 Supprimer un post-it
  async deletePostit(id) {
    const res = await authService.instance.delete(`/postits/${id}`);
    return res.data;
  },

  async getRetros() {
    const res = await authService.instance.get(`/retros`);
    return res.data;
  },

  async getCategories(retroId) {
    const res = await authService.instance.get(`/retros/categories/${retroId}`);
    return res.data;
  },

  async getUserRetroLinks(userId) {
    const res = await authService.instance.get(`/sprint-retro-team/user/${userId}`);
    return res.data;
  },

  async getRetroLinksByTeamId(teamId) {
    const res = await authService.instance.get(`/sprint-retro-team/team/${teamId}`);
    return res.data;
  },

  async getTeams() {
    const res = await authService.instance.get(`/teams`);
    return res.data;
  },

  async getNextSprintName(currentLinkId, teamId) {
    const res = await authService.instance.get(
      `/sprint-retro-team/getNextSprintName/${currentLinkId}/${teamId}`
    );
    return res.data;
  },

  async getTeamsWithMembers() {
    const res = await authService.instance.get(`/teams/with-members`);
    return res.data;
  },
};
