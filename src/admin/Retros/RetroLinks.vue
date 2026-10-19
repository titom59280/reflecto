<template>
  <div class="retros-grid tab-content-animated">
    <div class="button-hide">
      <button @click="toggleViewAll">
        {{ viewAllLink ? $t('adminRetros.links.hideDone') : $t('adminRetros.links.showAll') }}
      </button>
    </div>

    <div class="retro-list retro-container">
      <div v-for="team in teams" :key="team.id" class="team-panel">
        <div class="team-header" @click="toggleTeam(team.id)">
          <h3 class="team-header-title">{{ team.name }}</h3>
          <span>{{ openTeams[team.id] ? '▲' : '▼' }}</span>
        </div>

        <transition name="fade" @before-enter="beforeEnter" @enter="enter" @leave="leave">
          <div v-show="openTeams[team.id]" class="panel-content">
            <div v-if="getLinksForTeam(team.id).length === 0">
              {{ getMessageNoLinkTeam() }}
            </div>

            <div v-for="link in getLinksForTeam(team.id)" :key="link.id" class="retro-card">
              <div class="sprint">
                <div class="infos">
                  <span v-if="link.isRetroDone" class="badge"
                    >✅ {{ $t('adminRetros.links.retroDone') }}</span
                  >
                </div>
                <div class="retro-header">
                  <div>
                    <p>
                      <strong>{{ $t('adminRetros.links.sprintLabel') }}</strong>
                      {{ getSprintName(link.sprintId) }}
                    </p>
                    <p>
                      <strong>{{ $t('adminRetros.links.retroLabel') }}</strong>
                      {{ getRetroName(link.retroId) }}
                    </p>
                  </div>
                  <div class="actions">
                    <button
                      v-if="link.isRetroDone && !link.isClosed"
                      @click="$emit('start-retro', link.id)"
                    >
                      {{ $t('adminRetros.links.startRetroOfRetro') }}
                    </button>
                    <button
                      v-if="!link.isRetroDone && !link.isActif"
                      class="delete"
                      :aria-label="$t('common.delete')"
                      :title="$t('common.delete')"
                      @click="removeLink(link.id)"
                    >
                      🗑️
                    </button>
                    <button
                      v-if="!link.isRetroDone && !link.isActif"
                      class="badge"
                      :aria-label="$t('adminRetros.links.activate')"
                      :title="$t('adminRetros.links.activate')"
                      @click="activate(link.id)"
                    >
                      ✅
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import AdminService from './../AdminService';

export default {
  props: {
    teams: {
      type: Array,
      default: () => [],
    },
    links: {
      type: Array,
      default: () => [],
    },
    retros: {
      type: Array,
      default: () => [],
    },
    sprints: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['refresh-links', 'start-retro'],
  data() {
    return {
      openTeams: {},
      viewAllLink: true,
    };
  },
  methods: {
    beforeEnter(el) {
      el.style.height = '0';
      el.style.opacity = '0';
    },
    enter(el) {
      el.style.transition = 'all 0.3s ease';
      const height = el.scrollHeight;
      el.style.height = height + 'px';
      el.style.opacity = '1';
      el.addEventListener(
        'transitionend',
        () => {
          el.style.height = 'auto';
        },
        { once: true }
      );
    },
    leave(el) {
      el.style.transition = 'all 0.3s ease';
      el.style.height = el.scrollHeight + 'px';
      requestAnimationFrame(() => {
        el.style.height = '0';
        el.style.opacity = '0';
      });
    },
    toggleTeam(id) {
      this.openTeams[id] = !this.openTeams[id];
    },
    toggleViewAll() {
      this.viewAllLink = !this.viewAllLink;
    },
    getLinksForTeam(teamId) {
      return this.links.filter(
        (link) =>
          link.teamId === teamId && (this.viewAllLink || !link.isRetroDone || !link.isClosed)
      );
    },
    getRetroName(retroId) {
      const retro = this.retros.find((r) => r.id === retroId);
      return retro ? retro.name : this.$t('adminRetros.links.unknownRetro');
    },
    getSprintName(sprintId) {
      const sprint = this.sprints.find((s) => s.id === sprintId);
      return sprint ? sprint.name : this.$t('adminRetros.links.unknownSprint');
    },
    getMessageNoLinkTeam() {
      return this.viewAllLink
        ? this.$t('adminRetros.links.noLinkAll')
        : this.$t('adminRetros.links.noLinkUpcoming');
    },
    async activate(linkId) {
      try {
        await AdminService.activateSprint(linkId);
        this.$emit('refresh-links');
        this.$root.showToast(this.$t('adminRetros.links.activated'), 'success');
      } catch (err) {
        if (err.status === 400) {
          this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
          return;
        }
        this.$root.showToast(this.$t('adminRetros.links.activateError'), 'error');
      }
    },
    async removeLink(linkId) {
      try {
        await AdminService.deleteRetroFromSprint(linkId);
        this.$emit('refresh-links');
        this.$root.showToast(this.$t('adminRetros.links.removed'), 'success');
      } catch (err) {
        this.$root.showToast(this.$t('adminRetros.shared.deleteError'), 'error');
      }
    },
  },
};
</script>

<style scoped>
/* Le CSS peut être réutilisé depuis RetrosManager.vue */
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

/* ===== Responsive ===== */
@media (max-width: 768px) {
  /* Panneaux d'équipes : une seule colonne si la largeur est insuffisante */
  .retro-container {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: 0.75rem;
  }

  .retro-list {
    padding: 0.75rem 0;
  }

  .team-panel {
    min-width: 0;
    margin-bottom: 0;
  }

  .team-header {
    gap: 0.5rem;
    min-height: 44px;
  }

  .team-header-title {
    margin: 0;
    font-size: 1.05rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .retro-card {
    padding: 0.75rem;
  }

  /* Infos et actions : passage à la ligne quand la place manque */
  .retro-header {
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .retro-header > div:first-child {
    min-width: 0;
    flex: 1 1 180px;
    overflow-wrap: anywhere;
  }

  .actions {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .actions button {
    margin-bottom: 0;
    min-height: 40px;
    min-width: 40px;
  }

  .button-hide button {
    min-height: 40px;
  }
}

@media (max-width: 480px) {
  .retro-header > div:first-child {
    flex-basis: 100%;
  }

  .actions {
    width: 100%;
  }

  .button-hide button {
    width: 100%;
  }
}
</style>
