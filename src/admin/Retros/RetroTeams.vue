<template>
  <div class="teams">
    <p v-if="teams.length === 0" class="empty-page">{{ $t('adminRetros.teams.noTeam') }}</p>

    <article
      v-for="team in teams"
      :key="team.id"
      class="team-card"
      :class="{ attention: hasPending(team.id) }"
    >
      <div class="team-head">
        <h3>{{ team.name }}</h3>
        <button type="button" class="btn btn-sec" @click="$emit('plan', team.id)">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> {{ $t('adminRetros.teams.plan') }}
        </button>
      </div>

      <div
        v-for="link in currentLinks(team.id)"
        :key="link.id"
        class="row"
        :class="{ pending: status(link) === 'pending' }"
      >
        <span class="status" :class="status(link)">{{ statusLabel(link) }}</span>
        <div class="info">
          <b>{{ sprintName(link.sprintId) }} · {{ retroName(link.retroId) }}</b>
          <small>{{ statusHint(link) }}</small>
        </div>
        <div class="actions">
          <template v-if="status(link) === 'pending'">
            <button type="button" class="btn btn-sec" @click="removeLink(link)">
              {{ $t('adminRetros.teams.remove') }}
            </button>
            <button type="button" class="btn btn-pri" :disabled="busy" @click="activate(link)">
              {{ $t('adminRetros.teams.activate') }}
            </button>
          </template>
          <button v-else type="button" class="btn btn-sec" @click="$emit('open-board', team.id)">
            {{ $t('adminRetros.teams.openBoard') }}
          </button>
        </div>
      </div>

      <div v-if="currentLinks(team.id).length === 0" class="empty">
        <p>{{ $t('adminRetros.teams.nothingPlanned') }}</p>
        <button type="button" class="btn btn-pri" @click="$emit('plan', team.id)">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
          {{ $t('adminRetros.teams.planRetro') }}
        </button>
      </div>

      <template v-if="doneLinks(team.id).length">
        <button type="button" class="history-toggle" @click="toggleHistory(team.id)">
          {{ openHistory[team.id] ? '▾' : '▸' }}
          {{ $t('adminRetros.teams.history', doneLinks(team.id).length) }}
        </button>
        <div v-if="openHistory[team.id]" class="history">
          <div v-for="link in doneLinks(team.id)" :key="link.id" class="row">
            <span class="status done">{{ $t('adminRetros.teams.status.done') }}</span>
            <div class="info">
              <b>{{ sprintName(link.sprintId) }} · {{ retroName(link.retroId) }}</b>
            </div>
            <div class="actions">
              <button type="button" class="btn btn-sec" @click="$emit('view-postits', link)">
                {{ $t('adminRetros.teams.viewPostits') }}
              </button>
              <button
                v-if="!link.isClosed"
                type="button"
                class="btn btn-sec"
                @click="$emit('start-retro', link.id)"
              >
                {{ $t('adminRetros.teams.retroOfRetro') }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </article>
  </div>
</template>

<script>
import AdminService from './../AdminService';

export default {
  props: {
    teams: { type: Array, default: () => [] },
    links: { type: Array, default: () => [] },
    retros: { type: Array, default: () => [] },
    sprints: { type: Array, default: () => [] },
  },
  emits: ['refresh', 'plan', 'open-board', 'start-retro', 'view-postits'],
  data() {
    return {
      openHistory: {},
      busy: false,
    };
  },
  methods: {
    // Une rétro terminée (ou clôturée) passe dans l'historique
    isDone(link) {
      return link.isRetroDone || link.isClosed;
    },
    status(link) {
      if (this.isDone(link)) return 'done';
      return link.isActif ? 'active' : 'pending';
    },
    statusLabel(link) {
      return this.$t(`adminRetros.teams.status.${this.status(link)}`);
    },
    statusHint(link) {
      if (this.status(link) === 'pending') return this.$t('adminRetros.teams.hintPending');
      return link.isRetroInProgress
        ? this.$t('adminRetros.teams.hintInProgress')
        : this.$t('adminRetros.teams.hintActive');
    },
    sprintTime(sprintId) {
      const sprint = this.sprints.find((s) => s.id === sprintId);
      return sprint ? new Date(sprint.createdAt).getTime() : 0;
    },
    teamLinks(teamId) {
      return this.links
        .filter((link) => link.teamId === teamId)
        .sort((a, b) => this.sprintTime(b.sprintId) - this.sprintTime(a.sprintId));
    },
    currentLinks(teamId) {
      // L'active d'abord, puis celles à activer
      return this.teamLinks(teamId)
        .filter((link) => !this.isDone(link))
        .sort((a, b) => Number(b.isActif) - Number(a.isActif));
    },
    doneLinks(teamId) {
      return this.teamLinks(teamId).filter((link) => this.isDone(link));
    },
    hasPending(teamId) {
      return this.currentLinks(teamId).some((link) => this.status(link) === 'pending');
    },
    sprintName(sprintId) {
      return (
        this.sprints.find((s) => s.id === sprintId)?.name ||
        this.$t('adminRetros.links.unknownSprint')
      );
    },
    retroName(retroId) {
      return (
        this.retros.find((r) => r.id === retroId)?.name || this.$t('adminRetros.links.unknownRetro')
      );
    },
    toggleHistory(teamId) {
      this.openHistory = { ...this.openHistory, [teamId]: !this.openHistory[teamId] };
    },
    async activate(link) {
      this.busy = true;
      try {
        const result = await AdminService.activateSprint(link.id);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 5000);
          return;
        }
        this.$root.showToast(this.$t('adminRetros.teams.activated'), 'success');
        this.$emit('refresh');
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      } finally {
        this.busy = false;
      }
    },
    async removeLink(link) {
      try {
        const result = await AdminService.deleteRetroFromSprint(link.id);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error');
          return;
        }
        this.$root.showToast(this.$t('adminRetros.teams.removed'), 'success');
        this.$emit('refresh');
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
  },
};
</script>

<style scoped>
.teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
  gap: 1.25rem;
}

.empty-page {
  color: #6b7678;
  text-align: center;
}

.team-card {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  overflow: hidden;
}

.team-card.attention {
  border-color: #ef9f27;
  box-shadow: 0 0 0 3px #faeeda;
}

.team-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.2rem;
}

.team-head h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #003d47;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.85rem 1.2rem;
  border-top: 1px solid #f1ede3;
}

.row.pending {
  background: #fffaf0;
}

.info {
  flex: 1;
  min-width: 0;
}

.info b {
  display: block;
  color: #003d47;
  overflow-wrap: anywhere;
}

.info small {
  color: #6b7678;
  font-size: 0.88rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
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

.status.pending {
  background: #faeeda;
  color: #633806;
}

.status.done {
  background: #f1efe8;
  color: #444441;
}

.empty {
  padding: 1.3rem 1.2rem;
  border-top: 1px solid #f1ede3;
  text-align: center;
  color: #6b7678;
}

.empty p {
  margin: 0 0 0.7rem;
}

.history-toggle {
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-top: 1px solid #f1ede3;
  padding: 0.75rem 1.2rem;
  color: #005a64;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
}

.history {
  background: #fcfbf7;
}

.btn {
  border-radius: 8px;
  padding: 0.5rem 0.95rem;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  border: 1px solid #005a64;
  cursor: pointer;
  font-family: inherit;
  min-height: 38px;
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

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .row {
    flex-wrap: wrap;
  }

  .actions {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .team-head {
    flex-wrap: wrap;
  }

  .actions .btn {
    flex: 1 1 auto;
  }
}
</style>
