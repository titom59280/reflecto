<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button">← {{ $t('common.back') }}</router-link>
    <h1 class="page-title">{{ $t('admin.sprints.title') }}</h1>
  </div>

  <div class="sprints-content tab-content-animated">
    <div class="toolbar">
      <div class="seg" role="tablist">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          role="tab"
          :aria-selected="filter === f.key"
          :class="{ on: filter === f.key }"
          @click="filter = f.key"
        >
          {{ $t(`admin.sprints.filters.${f.key}`) }} <span class="count">({{ f.count }})</span>
        </button>
      </div>

      <form class="create-form" @submit.prevent="createSprint">
        <label for="sprint-name" class="sr-only">{{ $t('admin.sprints.nameLabel') }}</label>
        <input
          id="sprint-name"
          v-model="newSprintName"
          type="text"
          :placeholder="$t('admin.sprints.namePlaceholder')"
          :title="$t('admin.sprints.createHint')"
        />
        <button type="submit" class="btn btn-pri" :disabled="creating">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> {{ $t('admin.sprints.create') }}
        </button>
      </form>
    </div>

    <div class="sprints-list">
      <p v-if="sprints.length === 0" class="empty-page">{{ $t('admin.sprints.empty') }}</p>
      <p v-else-if="visibleSections.length === 0" class="empty-page">
        {{ $t('admin.sprints.emptyFilter') }}
      </p>

      <section v-for="section in visibleSections" :key="section.key" class="section">
        <button
          v-if="section.key === 'done' && filter === 'all'"
          type="button"
          class="section-toggle"
          @click="showDone = !showDone"
        >
          {{ showDone ? '▾' : '▸' }} {{ $t('admin.sprints.filters.done') }} ({{
            section.sprints.length
          }})
        </button>
        <h2 v-else class="section-title">{{ $t(`admin.sprints.filters.${section.key}`) }}</h2>

        <div v-if="section.key !== 'done' || filter === 'done' || showDone" class="card">
          <div v-for="sprint in section.sprints" :key="sprint.id" class="row">
            <span class="status" :class="section.key">
              {{ $t(`admin.sprints.status.${section.key}`) }}
            </span>
            <div class="info">
              <b>{{ sprint.name }}</b>
              <div v-if="linksOf(sprint.id).length" class="chips">
                <span v-for="link in linksOf(sprint.id)" :key="link.id" class="chip">
                  <i class="fa-solid fa-users" aria-hidden="true"></i>
                  {{ nameOf(teams, link.teamId) }} · {{ nameOf(retros, link.retroId) }} ·
                  <b :class="linkStatus(link)">{{
                    $t(`adminRetros.teams.status.${linkStatus(link)}`)
                  }}</b>
                </span>
              </div>
              <small v-else>{{ $t('admin.sprints.noRetro') }}</small>
            </div>
            <!-- Actions uniquement pour un sprint sans rétro rattachée -->
            <div v-if="!linksOf(sprint.id).length" class="actions">
              <router-link
                v-if="section.key !== 'done'"
                :to="planRoute(sprint)"
                class="btn btn-sec"
              >
                {{ $t('admin.sprints.planRetro') }}
              </router-link>
              <button type="button" class="btn btn-danger" @click="sprintToDelete = sprint">
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Confirmation de suppression -->
  <div v-if="sprintToDelete" class="overlay" @click.self="sprintToDelete = null">
    <div class="modal" role="dialog" aria-modal="true">
      <h2>{{ $t('admin.sprints.confirmDeleteTitle', { name: sprintToDelete.name }) }}</h2>
      <p>{{ $t('admin.sprints.confirmDeleteText') }}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-sec" @click="sprintToDelete = null">
          {{ $t('common.cancel') }}
        </button>
        <button type="button" class="btn btn-danger-solid" @click="deleteSprint">
          {{ $t('common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import AdminService from './AdminService';

// Propose le nom suivant à partir du dernier sprint : « Sprint 316 » → « Sprint 317 »,
// « PI4-S03 » → « PI4-S04 ». Sans numéro final, aucune suggestion (nom libre).
function suggestNextName(lastName) {
  if (!lastName) return '';
  const match = lastName.match(/^(.*?)(\d+)(\D*)$/);
  if (!match) return '';
  const [, prefix, number, suffix] = match;
  const next = String(Number(number) + 1).padStart(number.length, '0');
  return `${prefix}${next}${suffix}`;
}

export default {
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      sprints: [],
      links: [],
      teams: [],
      retros: [],
      filter: 'all',
      showDone: false,
      newSprintName: '',
      creating: false,
      sprintToDelete: null,
    };
  },
  computed: {
    sortedSprints() {
      return [...this.sprints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    grouped() {
      const groups = { active: [], upcoming: [], done: [] };
      this.sortedSprints.forEach((sprint) => groups[this.sprintStatus(sprint)].push(sprint));
      // À venir : le prochain sprint en premier
      groups.upcoming.reverse();
      return groups;
    },
    filters() {
      return [
        { key: 'all', count: this.sprints.length },
        { key: 'active', count: this.grouped.active.length },
        { key: 'upcoming', count: this.grouped.upcoming.length },
        { key: 'done', count: this.grouped.done.length },
      ];
    },
    visibleSections() {
      const keys = this.filter === 'all' ? ['active', 'upcoming', 'done'] : [this.filter];
      return keys
        .map((key) => ({ key, sprints: this.grouped[key] }))
        .filter((section) => section.sprints.length > 0);
    },
  },
  async mounted() {
    await Promise.all([this.fetchSprints(), this.fetchContext()]);
  },
  methods: {
    nameOf(list, id) {
      return list.find((item) => item.id === id)?.name || '—';
    },
    linksOf(sprintId) {
      return this.links.filter((link) => link.sprintId === sprintId);
    },
    linkStatus(link) {
      if (link.isRetroDone || link.isClosed) return 'done';
      return link.isActif ? 'active' : 'pending';
    },
    // Terminé : sprint clôturé ; En cours : une rétro active ; sinon À venir
    sprintStatus(sprint) {
      if (sprint.isClosed || sprint.isRetroDone) return 'done';
      const hasActiveRetro = this.linksOf(sprint.id).some(
        (link) => link.isActif && !link.isRetroDone
      );
      return hasActiveRetro ? 'active' : 'upcoming';
    },
    planRoute(sprint) {
      // Une seule équipe : on ouvre directement la planification pour elle et ce sprint
      if (this.teams.length === 1) {
        return { path: '/admin/retros', query: { plan: this.teams[0].id, sprint: sprint.id } };
      }
      return { path: '/admin/retros' };
    },
    async fetchSprints() {
      try {
        const resultSprints = await AdminService.getSprints();
        if (!resultSprints.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultSprints), 'error');
          return;
        }
        this.sprints = resultSprints.result;
        this.newSprintName = suggestNextName(this.sortedSprints[0]?.name) || '';
      } catch (error) {
        this.$root.showToast(this.$t('admin.sprints.toast.loadError'), 'error');
      }
    },
    // Rétros et équipes rattachées, pour afficher les étiquettes de chaque sprint
    async fetchContext() {
      try {
        const [resultLinks, resultTeams, resultRetros] = await Promise.all([
          AdminService.getSprintRetroLinks(),
          AdminService.getTeams(),
          AdminService.getRetros(),
        ]);
        if (resultLinks.isSuccess) this.links = resultLinks.result;
        if (resultTeams.isSuccess) this.teams = resultTeams.result;
        if (resultRetros.isSuccess) this.retros = resultRetros.result;
      } catch (error) {
        this.$root.showToast(this.$t('admin.sprints.toast.loadError'), 'error');
      }
    },
    async createSprint() {
      const name = this.newSprintName.trim();
      if (!name) {
        this.$root.showToast(this.$t('admin.sprints.nameRequired'), 'error', 4000);
        return;
      }
      if (this.sprints.some((s) => s.name.trim().toUpperCase() === name.toUpperCase())) {
        this.$root.showToast(this.$t('api.SPRINT_NAME_EXISTS'), 'error', 4000);
        return;
      }
      this.creating = true;
      try {
        const resultCreate = await AdminService.createSprint({ name, isActive: false });
        if (!resultCreate.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultCreate), 'error', 4000);
          return;
        }
        this.$root.showToast(this.$t('admin.sprints.toast.createdName', { name }), 'success');
        await this.fetchSprints();
      } catch (err) {
        this.$root.showToast(this.$t('admin.sprints.toast.createError'), 'error', 4000);
      } finally {
        this.creating = false;
      }
    },
    async deleteSprint() {
      const sprint = this.sprintToDelete;
      this.sprintToDelete = null;
      try {
        const resultDelete = await AdminService.deleteSprint(sprint.id);
        if (!resultDelete.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultDelete), 'error');
          return;
        }
        this.$root.showToast(this.$t('admin.sprints.toast.deleted'), 'success');
        await this.fetchSprints();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
  },
};
</script>

<style scoped>
/* Même gabarit que la page des rétros */
.sprints-content {
  /* width: 100% indispensable : dans le conteneur flex de la page, margin auto
     ferait sinon rétrécir le bloc à la largeur de son contenu */
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  /* La page occupe la hauteur disponible : seule la liste défile, le haut reste visible */
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sprints-content > * {
  flex: none;
}

.sprints-content > .sprints-list {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.seg {
  display: inline-flex;
  flex-wrap: wrap;
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.seg button {
  border: 0;
  background: none;
  padding: 0.55rem 0.95rem;
  border-radius: 9px;
  font-size: 0.95rem;
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

.create-form {
  display: flex;
  gap: 0.5rem;
}

.create-form input {
  width: 190px;
  padding: 0.55rem 0.7rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  min-width: 0;
}

.create-form input:focus {
  border-color: #002b36;
  outline: none;
  box-shadow: 0 0 4px #002b3666;
}

.empty-page {
  color: #6b7678;
  text-align: center;
  margin-top: 2rem;
}

.section {
  margin-bottom: 1.25rem;
}

.section-title,
.section-toggle {
  font-size: 0.95rem;
  font-weight: 600;
  color: #5b6669;
  margin: 0 0 0.5rem;
}

.section-toggle {
  background: none;
  border: 0;
  padding: 0;
  color: #005a64;
  cursor: pointer;
  font-family: inherit;
}

.card {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.85rem 1.2rem;
  border-top: 1px solid #f1ede3;
}

.row:first-child {
  border-top: 0;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  white-space: nowrap;
}

.status.active {
  background: #eaf3de;
  color: #27500a;
}

.status.upcoming {
  background: #e6f1fb;
  color: #0c447c;
}

.status.done {
  background: #f1efe8;
  color: #444441;
}

.info {
  flex: 1;
  min-width: 0;
}

.info > b {
  display: block;
  color: #003d47;
  font-size: 1.02rem;
  overflow-wrap: anywhere;
}

.info small {
  color: #6b7678;
  font-size: 0.88rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.35rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  border: 1px solid #ece7da;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  background: #fcfbf7;
  color: #3a4648;
}

.chip b.active {
  color: #27500a;
}

.chip b.pending {
  color: #633806;
}

.chip b.done {
  color: #5f5e5a;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 8px;
  padding: 0.5rem 0.95rem;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  border: 1px solid #005a64;
  cursor: pointer;
  font-family: inherit;
  min-height: 38px;
  text-decoration: none;
  transition: background 0.2s ease;
}

.btn-pri {
  background: #005a64;
  color: #ffffff;
}

.btn-pri:hover {
  background: #002b36;
}

.btn-pri:disabled {
  opacity: 0.7;
  cursor: wait;
}

.btn-sec {
  background: #ffffff;
  color: #005a64;
}

.btn-sec:hover {
  background: #e6f0f2;
}

.btn-danger {
  background: #ffffff;
  color: #a32d2d;
  border-color: #a32d2d;
}

.btn-danger:hover {
  background: #fcebeb;
}

.btn-danger-solid {
  background: #a32d2d;
  color: #ffffff;
  border-color: #a32d2d;
}

/* ===== Confirmation ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 440px;
  padding: 1.5rem 1.6rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.modal h2 {
  margin: 0 0 0.5rem;
  color: #002b36;
  font-size: 1.2rem;
}

.modal p {
  margin: 0;
  color: #5b6669;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  /* Sur mobile, toute la page défile */
  .sprints-content {
    display: block;
  }

  .sprints-content > .sprints-list {
    overflow-y: visible;
  }

  .create-form {
    width: 100%;
  }

  .create-form input {
    flex: 1;
    width: auto;
  }

  .row {
    flex-wrap: wrap;
  }

  .actions {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .seg {
    width: 100%;
  }

  .seg button {
    flex: 1 1 40%;
    padding: 0.5rem;
    font-size: 0.88rem;
  }

  .actions .btn {
    flex: 1 1 auto;
    justify-content: center;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }
}
</style>
