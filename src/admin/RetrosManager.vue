<template>
  <div>
    <div class="admin-header">
      <router-link v-if="!currentLinkId" to="/admin" class="back-admin-button">
        ← Retour
      </router-link>
      <a v-else class="back-admin-button" @click="currentLinkId = null"> ← Retour </a>
      <h1 class="page-title">Gérer les rétros</h1>
    </div>
    <RetroDeRetro v-if="currentLinkId" :current-link-id="currentLinkId" @close="closeRetro" />
    <AdminTabs v-else :tabs="tabLabels">
      <template #tab-0>
        <div class="tab-content-animated">
          <RetroCreate
            :sprints="sprints"
            :teams="teams"
            :links="links"
            @refresh="
              fetchRetros();
              fetchLinks();
            "
          />
        </div>
      </template>
      <template #tab-1>
        <RetroList :retros="retros" @refresh="fetchRetros" />
      </template>
      <template #tab-2>
        <RetroAssociate
          :retros="retros"
          :sprints="sprints"
          :teams="teams"
          @refresh-links="fetchLinks"
        />
      </template>
      <template #tab-3>
        <div v-if="links.length === 0">Aucunes associations pour le moment.</div>
        <div v-else class="retros-grid tab-content-animated">
          <RetroLinks
            :teams="teams"
            :retros="retros"
            :sprints="sprints"
            :links="links"
            @refresh-links="fetchLinks"
            @start-retro="doRetroRetro"
          />
        </div>
      </template>
    </AdminTabs>
  </div>
</template>

<script>
import AdminService from './AdminService';
import AdminTabs from './AdminTabs.vue';
import RetroDeRetro from './RetroDeRetro.vue';
import RetroAssociate from './Retros/RetroAssociate.vue';
import RetroCreate from './Retros/RetroCreate.vue';
import RetroLinks from './Retros/RetroLinks.vue';
import RetroList from './Retros/RetroList.vue';
export default {
  components: {
    AdminTabs,
    RetroDeRetro,
    RetroCreate,
    RetroList,
    RetroAssociate,
    RetroLinks,
  },
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      openTeams: {},
      messageError: '',
      retros: [],
      currentLinkId: null,
      sprints: [],
      teams: [],
      links: [],
      selectedTeamIdForRetroSprint: '',
      viewAllLink: true,
      selectedSprintId: '',
      messageBoutonListLink: 'Masquer les retros faites',
      selectedRetroId: '',
      newRetro: {
        name: '',
        categories: [{ name: '', description: '', image: null }],
      },
      tabLabels: [
        { label: 'Créer une rétro' },
        { label: 'Liste des rétros' },
        { label: 'Associer une rétro' },
        { label: 'Associations existantes' },
      ],
    };
  },
  computed: {
    retrosByTeam() {
      const grouped = {};
      for (const retro of this.retros) {
        if (!grouped[retro.teamId]) {
          grouped[retro.teamId] = [];
        }
        grouped[retro.teamId].push(retro);
      }
      return grouped;
    },
  },
  mounted() {
    this.fetchRetros();
    this.fetchSprints();
    this.fetchLinks();
    this.fetchTeams();
  },
  methods: {
    closeRetro() {
      this.currentLinkId = null;
      this.fetchLinks();
    },
    doRetroRetro(linkId) {
      this.currentLinkId = linkId;
    },
    async fetchRetros() {
      try {
        const resultRetros = await AdminService.getRetros();
        if (!resultRetros.isSuccess) {
          this.$root.showToast(resultRetros.message, 'error');
          return;
        }
        this.retros = resultRetros.result;
      } catch (error) {
        this.$root.showToast('Erreur lors de la récupération des rétros', 'error');
      }
    },
    async fetchSprints() {
      try {
        const resultSprints = await AdminService.getSprints();
        if (!resultSprints.isSuccess) {
          this.$root.showToast(resultSprints.message, 'error');
          return;
        }
        this.sprints = resultSprints.result.filter((s) => !s.isRetroDone);
      } catch (error) {
        this.$root.showToast('Erreur lors de la récupération des sprints', 'error');
      }
    },
    async fetchLinks() {
      const resultRetroLinks = await AdminService.getSprintRetroLinks();
      console.log(resultRetroLinks);
      if (!resultRetroLinks.isSuccess) {
        this.$root.showToast(resultRetroLinks.message, 'error');
        return;
      }

      this.links = resultRetroLinks.result;
    },
    async fetchTeams() {
      try {
        const resultTeams = await AdminService.getTeams();
        if (!resultTeams.isSuccess) {
          this.$root.showToast(resultTeams.message, 'error');
          return;
        }
        this.teams = resultTeams.result;
        this.teams.forEach((eq) => {
          this.openTeams[eq.id] = false;
        });
      } catch (error) {
        this.$root.showToast('Erreur lors de la récupération des équipes', 'error');
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
  margin-bottom: 1rem;
}
.retro-header-title {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
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
  margin-bottom: 8px;
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

.retro-card {
  background-color: white;
  border: 1px solid #ddd;
  border-left: 4px solid #006d77;
  padding: 1rem;
  border-radius: 6px;
}

.retro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.retro-title {
  font-weight: bold;
  margin: 0.5rem 0 0.2rem;
}

.form-container {
  background-color: #fff;
  padding: 0.5rem;
}

.categories,
.accordions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.retro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.retro-card {
  position: relative;
  background-color: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.retro-header-title {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #014d64;
}

.retro-card p {
  margin: 0.2rem 0;
  color: #333;
}

.empty-text {
  font-style: italic;
  color: #777;
}

.retro-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.retro-group summary {
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.retro-group ul {
  margin-left: 1rem;
  padding-left: 1rem;
  border-left: 2px solid #ccc;
}
.team-accordion {
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.accordion-header {
  background: #f7f7f7;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.retro-list {
  padding: 1rem;
  background: #fff;
}

.infos {
  display: flex;
  justify-content: center;
}

.retro-card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.retro-categories {
  margin-top: 0.5rem;
  padding-left: 1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.accordion-enter,
.accordion-leave-to {
  opacity: 0;
}
.badge {
  background-color: #4caf50;
  color: white;
  border-radius: 6px;
  padding: 0.5rem;
}

.actions {
  display: flex;
  flex-direction: column;
}

.team-panel {
  border: 1px solid #ccc;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}

.team-header {
  background: #f0f0f0;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-content {
  padding: 10px;
  background: #fff;
}
</style>
