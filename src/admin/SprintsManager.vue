<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button"> ← Retour </router-link>
    <h1 class="page-title">Gérer les sprints</h1>
  </div>
  <AdminTabs :tabs="tabLabels">
    <template #tab-0>
      <div class="sprint-form form-container tab-content-animated">
        <p v-if="messageError" class="message">{{ messageError }}</p>
        <div class="form-group">
          <label>Numéro du sprint</label>
          <input v-model="newSprint.name" type="text" required />
        </div>
        <button type="submit" class="btn-submit" @click="createSprint">Créer le sprint</button>
      </div>
    </template>
    <template #tab-1>
      <div class="sprint-form tab-content-animated">
        <div v-if="sprints.length === 0">Aucun sprint pour le moment.</div>
        <div v-else class="sprints-grid">
          <div
            v-for="sprint in sortedSprints"
            :key="sprint.id"
            class="sprint-card"
            :class="{ done: sprint.isRetroDone }"
          >
            <div class="sprint-header">
              <h3 class="sprint-header-title">{{ sprint.name }}</h3>
              <span v-if="sprint.isClosed" title="Sprint fermé">🔒</span>
              <span v-if="!sprint.isClosed && sprint.isRetroDone" title="Sprint terminé">✅</span>
              <span v-if="!sprint.isClosed && !sprint.isRetroDone" title="Sprint actif ou à venir"
                >⏳</span
              >
              <div class="action">
                <button class="delete" @click="deleteSprint(sprint.id)">🗑️</button>
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
      messageError: '',
      sprints: [],
      newSprint: {
        name: '',
        isActive: false,
      },
      tabLabels: [{ label: 'Créer un sprint' }, { label: 'Liste des sprints' }],
    };
  },
  computed: {
    sortedSprints() {
      return [...this.sprints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  },
  mounted() {
    this.fetchSprints();
  },
  methods: {
    async fetchSprints() {
      try {
        const resultSprints = await AdminService.getSprints();
        if (!resultSprints.isSuccess) {
          this.$root.showToast(resultSprints.message, 'error');
          return;
        }
        this.sprints = resultSprints.result;
      } catch (error) {
        this.$root.showToast('Erreur lors du chargement des sprints', 'error');
      }
    },
    async createSprint() {
      try {
        this.newSprint.name = 'Sprint ' + this.newSprint.name;
        const resultCreate = await AdminService.createSprint(this.newSprint);
        if (!resultCreate.isSuccess) {
          this.$root.showToast(resultCreate.message, 'error');
          return;
        }
        this.newSprint.name = '';
        this.newSprint.isActive = false;
        this.$root.showToast('Le sprint a été créé', 'success');
        await this.fetchSprints();
      } catch (err) {
        this.$root.showToast('Erreur de lors de la création du sprints', 'error');
      }
    },
    async deleteSprint(id) {
      try {
        const resultDelete = await AdminService.deleteSprint(id);
        if (!resultDelete.isSuccess) {
          this.$root.showToast(resultDelete.message, 'error');
          return;
        }
        this.$root.showToast('Le sprint a été supprimé', 'success');
        this.fetchSprints();
      } catch (err) {
        console.log(err);
        this.$root.showToast(err.response.data.error, 'error');
      }
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
.category-group {
  border: 1px solid #014d64;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
  margin-bottom: 8px;
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
  border: 1px solid #005a64;
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

.sprint-card {
  background-color: white;
  border: 1px solid #ddd;
  border-left: 4px solid #006d77;
  padding: 1rem;
  border-radius: 6px;
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sprint-title {
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  max-width: 800px;
}

.sprint-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.sprint-card {
  position: relative;
  background-color: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.sprint-header-title {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #014d64;
}

.sprint-card p {
  margin: 0.2rem 0;
  color: #333;
}

.empty-text {
  font-style: italic;
  color: #777;
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
.done {
  background-color: #f9f9f9;
  border-left: 5px solid #999;
  opacity: 0.7;
}

.action {
  width: 130px;
  display: flex;
  justify-content: space-around;
}
</style>
