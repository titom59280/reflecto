<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button"> ← Retour </router-link>
    <h1 class="page-title">Gérer les membres</h1>
  </div>
  <AdminTabs :tabs="tabLabels">
    <template #tab-0>
      <div v-if="!canAddMembers" class="no-access">
        <span>Le nombre de membres a été atteint pour l'abonnement de votre entreprise</span>
      </div>
      <div v-else class="tab-content-animated">
        <form class="form-container" @submit.prevent="addMember">
          <div class="form-group">
            <label>Email</label>
            <input v-model="newMember.email" type="email" required />
          </div>
          <div class="form-group">
            <label>Nom complet</label>
            <input v-model="newMember.name" type="text" required />
          </div>
          <div class="form-regroup">
            <div class="form-group">
              <label for="scrum">Scrum Master</label>
              <div class="check-div">
                <input id="scrum" v-model="newMember.isScrumMaster" type="checkbox" />
              </div>
            </div>
            <div class="form-group">
              <label>Trigramme</label>
              <input v-model="newMember.trigramme" required />
            </div>
          </div>

          <div class="form-group">
            <label>Équipe</label>
            <select v-model="newMember.teamId" required>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>
          <button type="submit">Ajouter le membre</button>
        </form>
      </div>
    </template>
    <template #tab-1>
      <div class="team-form tab-content-animated">
        <h2>Membres</h2>
        <div v-if="members.length === 0">Aucun membre pour le moment.</div>
        <div v-else class="members-grid">
          <div v-for="member in members" :key="member.id" class="member-card">
            <div class="membre-header">
              <h3 class="membre-header-title">{{ member.name }}</h3>
              <div class="membre-actions">
                <button
                  v-if="!editingMember || editingMember.id !== member.id"
                  @click="editMember(member)"
                >
                  ✏️
                </button>
                <button
                  v-if="!editingMember || editingMember.id !== member.id"
                  class="delete"
                  @click="deleteMember(member.id)"
                >
                  🗑️
                </button>
                <button
                  v-if="editingMember && editingMember.id === member.id"
                  @click="saveMemberEdit"
                >
                  💾
                </button>
                <button
                  v-if="editingMember && editingMember.id === member.id"
                  class="delete"
                  @click="cancelEdit"
                >
                  ↩️
                </button>
              </div>
            </div>
            <p v-if="!editingMember"><strong>Nom :</strong> {{ member.name }}</p>
            <p v-if="!editingMember"><strong>Trigramme :</strong> {{ member.trigramme }}</p>
            <p v-if="!editingMember"><strong>Équipe :</strong> {{ getTeamName(member.teamId) }}</p>
            <!-- Formulaire d'édition conditionnel -->
            <div v-if="editingMember && editingMember.id === member.id" class="edit-form">
              <div class="form-group">
                <label>Nom Complet</label>
                <input v-model="editingMember.name" />
              </div>
              <div class="form-group">
                <label>Équipe</label>
                <select v-model="editingMember.teamId">
                  <option v-for="team in teams" :key="team.id" :value="team.id">
                    {{ team.name }}
                  </option>
                </select>
              </div>
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
  name: 'MembersManager',
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
      members: [],
      teams: [],
      canAddMembers: true,
      editingMember: null,
      newMember: {
        name: '',
        email: '',
        trigramme: '',
        teamId: '',
        isScrumMaster: false,
      },
      tabLabels: [{ label: 'Ajouter un membre' }, { label: 'Liste des membres' }],
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    editMember(member) {
      this.editingMember = { ...member }; // copie pour éviter les effets de bord
    },
    cancelEdit() {
      this.editingMember = null;
    },
    async saveMemberEdit() {
      await AdminService.updateMember(this.editingMember);
      this.$root.showToast('Les informations ont été enregistrées', 'success');
      await this.fetchData(); // rafraîchit la liste
      this.editingMember = null;
    },
    async fetchMembers() {
      const resultMembers = await AdminService.getMembers();
      if (!resultMembers.isSuccess) {
        this.$root.showToast(resultMembers.message, 'error');
        return;
      }

      this.members = resultMembers.result.members;
      this.canAddMembers = resultMembers.result.membersRemaining;
    },
    async fetchData() {
      const resultTeams = await AdminService.getTeams();
      if (!resultTeams.isSuccess) {
        this.$root.showToast(resultTeams.message, 'error');
        return;
      }
      this.teams = resultTeams.result;
      this.fetchMembers();
    },
    async addMember() {
      const resultCreateMember = await AdminService.createMember(this.newMember);

      if (!resultCreateMember.isSuccess) {
        this.$root.showToast(resultCreateMember.message, 'error');
        return;
      }

      this.$root.showToast('Le nouveau membre a été créé', 'success');
      this.newMember = { email: '', trigramme: '', teamId: '', name: '' };
      this.fetchData();
    },
    async deleteMember(id) {
      const resultDelete = await AdminService.deleteMember(id);
      if (!resultDelete.isSuccess) {
        this.$root.showToast(resultDelete.message, 'error');
        return;
      }

      this.$root.showToast('Le membre a été supprimé', 'success');
      this.fetchData();
    },
    getTeamName(teamId) {
      const team = this.teams.find((t) => t.id === teamId);
      return team ? team.name : 'Équipe inconnue';
    },
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fefaf3;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #222;
}

.form-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.3rem;
  font-weight: 600;
}

input,
select {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.check-div {
  display: flex;
  flex: 1;
}
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-top: 0.5em;
}
button {
  background-color: #005a64;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  background-color: white;
  color: #005a64;
  border: 1px solid #005a64;
}

.members-list {
  display: grid;
  gap: 1rem;
}

.member-card {
  background-color: white;
  border: 1px solid #ddd;
  border-left: 4px solid #006d77;
  padding: 1rem;
  border-radius: 6px;
}

.member-card p {
  margin: 0.3rem 0;
}

.membre-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
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

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: #333;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.form-regroup {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Le bouton en dessous, à gauche */
.form-container button[type='submit'] {
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

.form-container button[type='submit']:hover {
  background-color: white;
  color: #014d64;
  border: 1px solid #014d64;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.member-card {
  position: relative;
  background-color: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.membre-header-title {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #014d64;
}

.member-card p {
  margin: 0.2rem 0;
  color: #333;
}

button:not(.delete) {
  background-color: #005a64;
}

.delete {
  border: 1px solid #dc3545;
  background-color: #dc3545;
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

.no-access {
  color: #c00;
  font-weight: bold;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}
.edit-form input,
.edit-form select {
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.edit-form button {
  width: fit-content;
}

.membre-actions {
  width: 130px;
  display: flex;
  justify-content: space-around;
}
</style>
