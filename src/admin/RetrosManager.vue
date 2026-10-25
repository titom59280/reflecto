<template>
  <div class="retros-page">
    <div class="admin-header">
      <router-link v-if="!currentLinkId" to="/admin" class="back-admin-button">
        ← {{ $t('common.back') }}
      </router-link>
      <a v-else class="back-admin-button" @click="currentLinkId = null"
        >← {{ $t('common.back') }}</a
      >
      <h1 class="page-title">{{ $t('admin.retros.title') }}</h1>
    </div>

    <RetroDeRetro v-if="currentLinkId" :current-link-id="currentLinkId" @close="closeRetro" />

    <div v-else class="retros-content tab-content-animated">
      <div class="toolbar">
        <div class="seg" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'teams'"
            :class="{ on: tab === 'teams' }"
            @click="tab = 'teams'"
          >
            {{ $t('admin.retros.tabs.teams') }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'templates'"
            :class="{ on: tab === 'templates' }"
            @click="tab = 'templates'"
          >
            {{ $t('admin.retros.tabs.templates') }}
            <span class="count">({{ activeRetros.length }})</span>
          </button>
        </div>
        <span v-if="pendingCount" class="alert-pill">
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          {{ $t('admin.retros.toActivate', pendingCount) }}
        </span>
        <span v-else-if="links.length" class="alert-pill ok">
          <i class="fa-solid fa-check" aria-hidden="true"></i> {{ $t('admin.retros.upToDate') }}
        </span>
      </div>

      <div class="retros-list">
        <RetroTeams
          v-if="tab === 'teams'"
          :teams="teams"
          :links="links"
          :retros="retros"
          :sprints="sprints"
          @refresh="fetchLinks"
          @plan="openPlan"
          @open-board="openBoard"
          @start-retro="doRetroRetro"
          @view-postits="viewPostits"
        />
        <RetroTemplates
          v-else
          :retros="retros"
          :links="links"
          @refresh="fetchRetros"
          @create="openRetroForm(null)"
          @edit="openRetroForm"
        />
      </div>
    </div>

    <!-- Gardée montée (v-show) pendant la création d'une rétro pour conserver le sprint choisi -->
    <RetroPlanModal
      v-if="planTeam"
      v-show="!retroForm"
      :team="planTeam"
      :sprints="sprints"
      :retros="activeRetros"
      :links="links"
      :selected-retro-id="planRetroId"
      :selected-sprint-id="planSprintId"
      @close="closePlan"
      @planned="onPlanned"
      @create-retro="openRetroForm(null, true)"
    />

    <RetroEdit
      v-if="retroForm"
      :retro="retroForm.retro"
      :submit-label="retroForm.fromPlan ? $t('adminRetros.plan.createAndUse') : ''"
      @close="closeRetroForm"
      @saved="onRetroSaved"
    />

    <RetroPostitsModal
      v-if="postitsLink"
      :link="postitsLink"
      :retro-name="nameOf(retros, postitsLink.retroId)"
      :team-name="nameOf(teams, postitsLink.teamId)"
      :sprint-name="nameOf(sprints, postitsLink.sprintId)"
      @close="postitsLink = null"
    />
  </div>
</template>

<script>
import AdminService from './AdminService';
import RetroDeRetro from './RetroDeRetro.vue';
import RetroEdit from './Retros/RetroEdit.vue';
import RetroPlanModal from './Retros/RetroPlanModal.vue';
import RetroPostitsModal from './Retros/RetroPostitsModal.vue';
import RetroTeams from './Retros/RetroTeams.vue';
import RetroTemplates from './Retros/RetroTemplates.vue';

export default {
  components: {
    RetroDeRetro,
    RetroEdit,
    RetroPlanModal,
    RetroPostitsModal,
    RetroTeams,
    RetroTemplates,
  },
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      tab: 'teams',
      retros: [],
      currentLinkId: null,
      sprints: [],
      teams: [],
      links: [],
      planTeam: null,
      planRetroId: '',
      planSprintId: '',
      // { retro: null | rétro à modifier, fromPlan: ouverte depuis « Planifier » }
      retroForm: null,
      postitsLink: null,
    };
  },
  computed: {
    // Les rétros archivées restent chargées (noms de l'historique) mais ne sont plus proposées
    activeRetros() {
      return this.retros.filter((retro) => !retro.isArchived);
    },
    pendingCount() {
      return this.links.filter((l) => !l.isActif && !l.isRetroDone && !l.isClosed).length;
    },
  },
  async mounted() {
    await Promise.all([
      this.fetchRetros(),
      this.fetchSprints(),
      this.fetchLinks(),
      this.fetchTeams(),
    ]);
    // Lien direct depuis le tableau de rétro : /admin/retros?plan=<teamId>
    const teamToPlan = this.$route.query.plan;
    if (teamToPlan) this.openPlan(teamToPlan, this.$route.query.sprint || '');
  },
  methods: {
    nameOf(list, id) {
      return list.find((item) => item.id === id)?.name || '';
    },
    closeRetro() {
      this.currentLinkId = null;
      this.fetchLinks();
    },
    doRetroRetro(linkId) {
      this.currentLinkId = linkId;
    },
    openBoard(teamId) {
      this.$router.push({ path: '/retro', query: { team: teamId } });
    },
    viewPostits(link) {
      this.postitsLink = link;
    },
    openPlan(teamId, sprintId = '') {
      const team = this.teams.find((t) => t.id === teamId);
      if (!team) return;
      this.planRetroId = '';
      this.planSprintId = sprintId;
      this.planTeam = team;
    },
    closePlan() {
      this.planTeam = null;
      this.planRetroId = '';
    },
    onPlanned() {
      this.closePlan();
      this.tab = 'teams';
      this.fetchLinks();
    },
    openRetroForm(retro, fromPlan = false) {
      this.retroForm = { retro, fromPlan };
    },
    closeRetroForm() {
      this.retroForm = null;
    },
    async onRetroSaved(savedRetro) {
      const fromPlan = this.retroForm?.fromPlan;
      this.retroForm = null;
      await this.fetchRetros();
      // Créée depuis « Planifier » : on revient à la planification avec la rétro sélectionnée
      if (fromPlan && savedRetro?.id) this.planRetroId = savedRetro.id;
    },
    async fetchRetros() {
      try {
        const resultRetros = await AdminService.getRetros();
        if (!resultRetros.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultRetros), 'error');
          return;
        }
        this.retros = resultRetros.result;
      } catch (error) {
        this.$root.showToast(this.$t('admin.retros.toast.loadRetrosError'), 'error');
      }
    },
    async fetchSprints() {
      try {
        const resultSprints = await AdminService.getSprints();
        if (!resultSprints.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultSprints), 'error');
          return;
        }
        // Tous les sprints : les terminés servent à nommer l'historique
        this.sprints = resultSprints.result;
      } catch (error) {
        this.$root.showToast(this.$t('admin.retros.toast.loadSprintsError'), 'error');
      }
    },
    async fetchLinks() {
      try {
        const resultRetroLinks = await AdminService.getSprintRetroLinks();
        if (!resultRetroLinks.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultRetroLinks), 'error');
          return;
        }
        this.links = resultRetroLinks.result;
      } catch (error) {
        this.$root.showToast(this.$t('admin.retros.toast.loadLinksError'), 'error');
      }
    },
    async fetchTeams() {
      try {
        const resultTeams = await AdminService.getTeams();
        if (!resultTeams.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultTeams), 'error');
          return;
        }
        this.teams = resultTeams.result;
      } catch (error) {
        this.$root.showToast(this.$t('admin.retros.toast.loadTeamsError'), 'error');
      }
    },
  },
};
</script>

<style scoped>
/* Contenu centré, même largeur que le tableau de bord d'administration */
.retros-page {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.retros-page > .admin-header {
  flex: none;
}

.retros-content {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  /* La page occupe la hauteur disponible : seule la liste défile, le haut reste visible */
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.retros-content > .toolbar {
  flex: none;
}

.retros-list {
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Vue Équipes : la grille défile ; marge interne pour ne pas couper le halo orange */
.retros-list > .teams {
  min-height: 0;
  overflow-y: auto;
  padding: 4px;
  margin: -4px;
}

@media (max-width: 768px) {
  /* Sur mobile, toute la page défile */
  .retros-page,
  .retros-content,
  .retros-list {
    display: block;
  }

  .retros-list > .teams {
    overflow-y: visible;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.seg {
  display: inline-flex;
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.seg button {
  border: 0;
  background: none;
  padding: 0.6rem 1.1rem;
  border-radius: 9px;
  font-size: 1rem;
  font-weight: 600;
  color: #5b6669;
  cursor: pointer;
  font-family: inherit;
}

.seg button.on {
  background: #003d47;
  color: #ffffff;
}

.seg .count {
  font-weight: 500;
  opacity: 0.75;
}

.alert-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #faeeda;
  color: #633806;
  border: 1px solid #ef9f27;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
}

.alert-pill.ok {
  background: #eaf3de;
  color: #27500a;
  border-color: #97c459;
}

.back-admin-button {
  cursor: pointer;
}

@media (max-width: 480px) {
  .seg {
    width: 100%;
  }

  .seg button {
    flex: 1;
    padding: 0.55rem 0.5rem;
    font-size: 0.92rem;
  }
}
</style>
