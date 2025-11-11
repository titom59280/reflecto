<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button"> ← Retour </router-link>
    <h1 class="page-title">Gérer les équipes</h1>
  </div>
  <AdminTabs :tabs="tabLabels">
    <template #tab-0>
      <div v-if="canAddTeam" class="team-form form-container tab-content-animated">
        <div class="form-group">
          <label>Nom de l'équipe</label>
          <input v-model="newTeamName" type="text" />
        </div>
        <button class="btn-submit" @click="createTeam">Ajouter</button>
      </div>
      <div v-else class="no-access">
        <span>Le nombre d'équipe a été atteint pour l'abonnement de votre entreprise</span>
      </div>
    </template>
    <template #tab-1>
      <div class="team-form">
        <div v-if="teams.length === 0">Aucune équipe pour le moment.</div>
        <div v-else class="team-grid tab-content-animated">
          <div v-for="team in teams" :key="team.id" class="team-card">
            <div class="team-header">
              <h3 class="team-header-title">{{ team.name }}</h3>
              <div class="team-actions">
                <button v-if="editingTeamId !== team.id" @click="startTeamEdit(team)">✏️</button>
                <button
                  v-if="editingTeamId !== team.id"
                  class="delete"
                  :class="{ disabled: hasMembers(team.members) }"
                  :disabled="hasMembers(team.members)"
                  @click="deleteTeam(team.id)"
                >
                  🗑️
                </button>
                <button v-if="editingTeamId === team.id" @click="saveTeamEdit(team)">💾</button>
                <button v-if="editingTeamId === team.id" class="delete" @click="cancelTeamEdit">
                  ↩️
                </button>
              </div>
            </div>
            <div v-if="editingTeamId === team.id" class="form-group">
              <label>Nom de l'équipe</label>
              <input v-model="editedTeamName" type="text" />
            </div>
            <div v-if="editingTeamId !== team.id" class="members">
              <p class="members-title">Membres :</p>
              <ul v-if="team.members?.length">
                <li v-for="member in team.members" :key="member.id">
                  {{ member.name }} - {{ member.trigramme }}
                </li>
              </ul>
              <p v-else class="empty-text">Aucun membre</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AdminTabs>
</template>

<script>
import AdminService from './AdminService';
import AdminTabs from './AdminTabs.vue';
export default {
  name: 'TeamsManager',
  components: {
    AdminTabs,
  },
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      canAddTeam: true,
      newTeamName: '',
      editingTeamId: null,
      editedTeamName: '',
      teams: [],
      tabLabels: [{ label: 'Créer une équipe' }, { label: 'Liste des équipes' }],
    };
  },
  mounted() {
    this.fetchTeams();
  },
  methods: {
    startTeamEdit(team) {
      this.editingTeamId = team.id;
      this.editedTeamName = team.name;
    },
    cancelTeamEdit() {
      this.editingTeamId = null;
      this.editedTeamName = '';
    },
    async saveTeamEdit(team) {
      if (!this.editedTeamName.trim()) return;

      team.name = this.editedTeamName.trim();
      await AdminService.updateTeam(team);
      this.$root.showToast('Les informations ont été enregistrées', 'success');
      this.cancelTeamEdit();
    },
    hasMembers(members) {
      return members.length > 0;
    },
    async fetchTeams() {
      const resultTeams = await AdminService.getTeamsWithMembers();
      if (!resultTeams.isSuccess) {
        this.$root.showToast(resultTeams.message, 'error');
        return;
      }
      this.teams = resultTeams.result.teams;
      this.canAddTeam = resultTeams.result.teamsRemaining === 1;
    },
    async createTeam() {
      if (!this.newTeamName.trim()) return;
      const resultAddCreateTeam = await AdminService.createTeam(this.newTeamName);
      if (!resultAddCreateTeam.isSuccess) {
        this.$root.showToast(resultAddCreateTeam.message, 'error');
        return;
      }

      this.$root.showToast("L'équipe a été créée", 'success');
      this.newTeamName = '';
      this.fetchTeams();
    },
    async deleteTeam(teamId) {
      const resultDelete = await AdminService.deleteTeam(teamId);
      if (!resultDelete.isSuccess) {
        this.$root.showToast(resultDelete.message, 'error');
        return;
      }
      this.$root.showToast("L'équipe a été supprimée", 'success');
      this.fetchTeams();
    },
  },
};
</script>

<style scoped>
.admin-container {
  background-color: #fffaf2;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-width: 800px;
  margin: 0 auto;
}
.form-group {
  display: flex;
  flex-direction: column;
}

.team-form h2 {
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 1rem;
}

.form-group label {
  margin-bottom: 0.3rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

/* Le bouton en dessous, à gauche */
.btn-submit {
  grid-column: 1 / -1; /* Force le bouton à s'étendre sur toute la ligne */
  justify-self: start;
  padding: 0.6rem 1.2rem;
  background-color: #014d64; /* Couleur header */
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover {
  background-color: white;
  color: #014d64;
  border: 1px solid #014d64;
}

button {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

button:not(.delete) {
  background-color: #005a64;
}

.delete {
  background-color: #dc3545;
  border: 1px solid #dc3545;
}

button:not(.delete):hover {
  background-color: white;
  color: #005a64;
  border: 1px solid #005a64;
}

.delete:hover {
  background-color: white;
  color: #dc3545;
  border: 1px solid #dc3545;
}

/* Affichage des équipes */
.team-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.team-card {
  background-color: white;
  border: 1px solid #ddd;
  border-left: 4px solid #006d77;
  padding: 1rem;
  border-radius: 6px;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.members-title {
  font-weight: bold;
  margin: 0.5rem 0 0.2rem;
}

.form-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  max-width: 800px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.team-card {
  position: relative;
  background-color: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.no-access {
  color: #c00;
  font-weight: bold;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.team-header-title {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #014d64;
}

.team-card p {
  margin: 0.2rem 0;
  color: #333;
}

.empty-text {
  font-style: italic;
  color: #777;
}

.team-actions {
  width: 130px;
  display: flex;
  justify-content: space-around;
}

button.disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
  border: none;
}
</style>
