<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button">← {{ $t('common.back') }}</router-link>
    <h1 class="page-title">{{ $t('admin.teams.title') }}</h1>
  </div>

  <div class="teams-content tab-content-animated">
    <div class="toolbar">
      <span class="summary">
        {{ $t('admin.teams.summaryTeams', teams.length) }} ·
        {{ $t('admin.teams.summaryMembers', membersCount) }}
      </span>
      <form v-if="canAddTeam" class="create-form" @submit.prevent="createTeam">
        <label for="team-name" class="sr-only">{{ $t('admin.teams.name') }}</label>
        <input
          id="team-name"
          v-model="newTeamName"
          type="text"
          :placeholder="$t('admin.teams.namePlaceholder')"
        />
        <button type="submit" class="btn btn-pri" :disabled="saving">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> {{ $t('admin.teams.create') }}
        </button>
      </form>
    </div>

    <!-- Limite de l'offre : information, sans bloquer la page -->
    <div v-if="!canAddTeam && teams.length" class="plan-banner">
      <span>
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        {{ $t('admin.teams.limitBanner') }}
      </span>
      <router-link to="/pricing" class="btn btn-sec">{{ $t('admin.teams.seePlans') }}</router-link>
    </div>
    <p v-if="teams.length === 0" class="empty-page">{{ $t('admin.teams.empty') }}</p>

    <div class="teams">
      <article v-for="team in teams" :key="team.id" class="team-card">
        <!-- En-tête : nom, ou champ de renommage -->
        <form
          v-if="editingTeamId === team.id"
          class="team-head editing"
          @submit.prevent="saveTeamEdit(team)"
        >
          <label :for="`rename-${team.id}`" class="sr-only">{{ $t('admin.teams.name') }}</label>
          <input :id="`rename-${team.id}`" v-model="editedTeamName" type="text" />
          <button type="submit" class="btn btn-pri" :disabled="saving">
            {{ $t('common.save') }}
          </button>
          <button type="button" class="btn btn-sec" @click="cancelTeamEdit">
            {{ $t('common.cancel') }}
          </button>
        </form>
        <div v-else class="team-head">
          <h3>{{ team.name }}</h3>
          <div class="head-actions">
            <button type="button" class="btn btn-sec" @click="startTeamEdit(team)">
              {{ $t('admin.teams.rename') }}
            </button>
            <button
              v-if="isDeletable(team)"
              type="button"
              class="btn btn-danger"
              @click="teamToDelete = team"
            >
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>

        <!-- Membres -->
        <div class="row">
          <div v-if="team.members?.length" class="avatars" aria-hidden="true">
            <span
              v-for="member in team.members.slice(0, MAX_AVATARS)"
              :key="member.id"
              class="avatar"
              :style="avatarStyle(member.trigramme)"
              :title="member.name"
            >
              {{ member.trigramme }}
            </span>
            <span v-if="team.members.length > MAX_AVATARS" class="avatar more">
              +{{ team.members.length - MAX_AVATARS }}
            </span>
          </div>
          <span class="muted grow">
            {{
              team.members?.length
                ? $t('admin.teams.summaryMembers', team.members.length)
                : $t('admin.teams.noMembers')
            }}
          </span>
          <router-link
            :to="{ path: '/admin/members', query: { team: team.id } }"
            class="btn btn-sec"
          >
            {{ $t('admin.teams.manageMembers') }}
          </router-link>
        </div>

        <!-- Rétro en cours ou à activer -->
        <div class="row">
          <template v-if="currentLink(team.id)">
            <span class="status" :class="linkStatus(currentLink(team.id))">
              {{ $t(`admin.teams.retro.${linkStatus(currentLink(team.id))}`) }}
            </span>
            <span class="muted grow">
              {{ nameOf(sprints, currentLink(team.id).sprintId) }} ·
              {{ nameOf(retros, currentLink(team.id).retroId) }}
            </span>
            <router-link
              v-if="linkStatus(currentLink(team.id)) === 'active'"
              :to="{ path: '/retro', query: { team: team.id } }"
              class="btn btn-sec"
            >
              {{ $t('adminRetros.teams.openBoard') }}
            </router-link>
            <router-link v-else to="/admin/retros" class="btn btn-sec">
              {{ $t('admin.teams.viewRetros') }}
            </router-link>
          </template>
          <template v-else>
            <span class="muted grow">{{ $t('admin.teams.noRetro') }}</span>
            <router-link
              :to="{ path: '/admin/retros', query: { plan: team.id } }"
              class="btn btn-sec"
            >
              {{ $t('adminRetros.teams.planRetro') }}
            </router-link>
          </template>
        </div>
        <p v-if="!isDeletable(team)" class="card-note">
          {{ $t('admin.teams.notDeletable') }}
        </p>
      </article>
    </div>

    <!-- Confirmation de suppression (équipe vide uniquement) -->
    <div v-if="teamToDelete" class="overlay" @click.self="teamToDelete = null">
      <div class="modal" role="dialog" aria-modal="true">
        <h2>{{ $t('admin.teams.confirmDeleteTitle', { name: teamToDelete.name }) }}</h2>
        <p>{{ $t('admin.teams.confirmDeleteText') }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-sec" @click="teamToDelete = null">
            {{ $t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-danger-solid" @click="deleteTeam">
            {{ $t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AdminService from './AdminService';

const MAX_AVATARS = 4;
// Couleurs des pastilles de trigramme (fond, texte), choisies selon le trigramme
const AVATAR_COLORS = [
  ['#eeedfe', '#3c3489'],
  ['#e1f5ee', '#085041'],
  ['#faece7', '#712b13'],
  ['#e6f1fb', '#0c447c'],
  ['#faeeda', '#633806'],
  ['#fbeaf0', '#72243e'],
];

export default {
  name: 'TeamsManager',
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      MAX_AVATARS,
      canAddTeam: true,
      newTeamName: '',
      editingTeamId: null,
      editedTeamName: '',
      teamToDelete: null,
      saving: false,
      teams: [],
      links: [],
      sprints: [],
      retros: [],
    };
  },
  computed: {
    membersCount() {
      return this.teams.reduce((total, team) => total + (team.members?.length || 0), 0);
    },
  },
  mounted() {
    this.fetchTeams();
    this.fetchRetroContext();
  },
  methods: {
    nameOf(list, id) {
      return list.find((item) => item.id === id)?.name || '—';
    },
    avatarStyle(trigramme = '') {
      const hash = [...trigramme].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const [background, color] = AVATAR_COLORS[hash % AVATAR_COLORS.length];
      return { background, color };
    },
    linkStatus(link) {
      return link.isActif ? 'active' : 'pending';
    },
    sprintTime(sprintId) {
      const sprint = this.sprints.find((s) => s.id === sprintId);
      return sprint ? new Date(sprint.createdAt).getTime() : 0;
    },
    // Rétro active de l'équipe, sinon la prochaine à activer
    currentLink(teamId) {
      const open = this.links.filter(
        (link) => link.teamId === teamId && !link.isRetroDone && !link.isClosed
      );
      return (
        open.find((link) => link.isActif) ||
        open.sort((a, b) => this.sprintTime(a.sprintId) - this.sprintTime(b.sprintId))[0]
      );
    },
    // Seule une équipe sans membre ni historique de rétros peut être supprimée
    isDeletable(team) {
      return !team.members?.length && !team.hasHistory;
    },
    async deleteTeam() {
      const team = this.teamToDelete;
      this.teamToDelete = null;
      try {
        const result = await AdminService.deleteTeam(team.id);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 5000);
          return;
        }
        this.$root.showToast(this.$t('admin.teams.toast.deleted', { name: team.name }), 'success');
        await this.fetchTeams();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
    startTeamEdit(team) {
      this.editingTeamId = team.id;
      this.editedTeamName = team.name;
    },
    cancelTeamEdit() {
      this.editingTeamId = null;
      this.editedTeamName = '';
    },
    async saveTeamEdit(team) {
      const name = this.editedTeamName.trim();
      if (!name) {
        this.$root.showToast(this.$t('admin.teams.nameRequired'), 'error', 4000);
        return;
      }
      this.saving = true;
      try {
        const result = await AdminService.updateTeam({ ...team, name });
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 4000);
          return;
        }
        team.name = name;
        this.$root.showToast(this.$t('admin.teams.toast.renamed', { name }), 'success');
        this.cancelTeamEdit();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error', 4000);
      } finally {
        this.saving = false;
      }
    },
    async fetchTeams() {
      try {
        const resultTeams = await AdminService.getTeamsWithMembers();
        if (!resultTeams.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultTeams), 'error');
          return;
        }
        this.teams = resultTeams.result.teams;
        this.canAddTeam = resultTeams.result.teamsRemaining === 1;
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
    // Rétros, sprints et associations : pour afficher la rétro en cours de chaque équipe
    async fetchRetroContext() {
      try {
        const [resultLinks, resultSprints, resultRetros] = await Promise.all([
          AdminService.getSprintRetroLinks(),
          AdminService.getSprints(),
          AdminService.getRetros(),
        ]);
        if (resultLinks.isSuccess) this.links = resultLinks.result;
        if (resultSprints.isSuccess) this.sprints = resultSprints.result;
        if (resultRetros.isSuccess) this.retros = resultRetros.result;
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
    async createTeam() {
      const name = this.newTeamName.trim();
      if (!name) {
        this.$root.showToast(this.$t('admin.teams.nameRequired'), 'error', 4000);
        return;
      }
      this.saving = true;
      try {
        const result = await AdminService.createTeam(name);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 4000);
          return;
        }
        this.$root.showToast(this.$t('admin.teams.toast.created'), 'success');
        this.newTeamName = '';
        await this.fetchTeams();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error', 4000);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
/* Même gabarit que les pages rétros et sprints */
.teams-content {
  /* width: 100% indispensable : dans le conteneur flex de la page, margin auto
     ferait sinon rétrécir le bloc à la largeur de son contenu */
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  /* La page occupe la hauteur disponible : seul le tableau défile, le haut reste visible */
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.teams-content > * {
  flex: none;
}

/* Seule la grille des équipes défile ; marge interne pour ne pas couper le halo orange */
.teams-content > .teams {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px;
  margin: -4px;
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

.summary {
  color: #5b6669;
  font-weight: 600;
}

.create-form {
  display: flex;
  gap: 0.5rem;
}

input[type='text'] {
  padding: 0.55rem 0.7rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  min-width: 0;
}

input[type='text']:focus {
  border-color: #002b36;
  outline: none;
  box-shadow: 0 0 4px #002b3666;
}

.create-form input {
  width: 230px;
}

.empty-page {
  color: #6b7678;
  text-align: center;
  margin-top: 2rem;
}

.teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
  gap: 1.25rem;
}

.team-card {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  overflow: hidden;
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
  overflow-wrap: anywhere;
}

.team-head.editing input {
  flex: 1;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.8rem 1.2rem;
  border-top: 1px solid #f1ede3;
}

.grow {
  flex: 1;
  min-width: 0;
}

.muted {
  color: #6b7678;
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}

.avatars {
  display: flex;
  padding-left: 6px;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  margin-left: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.avatar.more {
  background: #f1efe8;
  color: #444441;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.head-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.card-note {
  margin: 0;
  padding: 0.6rem 1.2rem;
  border-top: 1px solid #f1ede3;
  color: #8a9294;
  font-size: 0.82rem;
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

.plan-banner {
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: #fffaf0;
  border: 1px solid #ef9f27;
  border-radius: 12px;
  padding: 0.75rem 1.1rem;
  color: #633806;
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

/* ===== Responsive ===== */
@media (max-width: 768px) {
  /* Sur mobile, toute la page défile */
  .teams-content {
    display: block;
  }

  .teams-content > .teams {
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

  .team-head.editing {
    flex-wrap: wrap;
  }

  .team-head.editing input {
    flex: 1 1 100%;
  }
}

@media (max-width: 480px) {
  .row .btn,
  .team-head.editing .btn,
  .plan-banner .btn {
    flex: 1 1 auto;
    justify-content: center;
  }
}
</style>
