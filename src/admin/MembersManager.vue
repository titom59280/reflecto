<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button">← {{ $t('common.back') }}</router-link>
    <h1 class="page-title">{{ $t('admin.members.title') }}</h1>
  </div>

  <div class="members-content tab-content-animated">
    <div class="toolbar">
      <span class="summary">
        {{ $t('admin.members.summaryMembers', members.length) }} ·
        {{ $t('admin.members.summaryScrumMasters', scrumMastersCount) }}
        <template v-if="pendingCount">
          · {{ $t('admin.members.summaryPending', pendingCount) }}
        </template>
      </span>
      <button v-if="canAddMembers" type="button" class="btn btn-pri" @click="openForm(null)">
        <i class="fa-solid fa-user-plus" aria-hidden="true"></i> {{ $t('admin.members.add') }}
      </button>
    </div>

    <div v-if="!canAddMembers" class="plan-banner">
      <span>
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        {{ $t('admin.members.limitBanner', { count: members.length, limit: membersLimit }) }}
      </span>
      <router-link to="/pricing" class="btn btn-sec">{{ $t('admin.teams.seePlans') }}</router-link>
    </div>
    <div class="filters">
      <label for="member-search" class="sr-only">{{ $t('admin.members.search') }}</label>
      <div class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input
          id="member-search"
          v-model="search"
          type="search"
          :placeholder="$t('admin.members.search')"
        />
      </div>
      <div class="chips" role="tablist">
        <button
          type="button"
          role="tab"
          class="chip"
          :class="{ on: !teamFilter }"
          :aria-selected="!teamFilter"
          @click="setTeamFilter('')"
        >
          {{ $t('admin.members.allTeams') }}
        </button>
        <button
          v-for="team in teams"
          :key="team.id"
          type="button"
          role="tab"
          class="chip"
          :class="{ on: teamFilter === team.id }"
          :aria-selected="teamFilter === team.id"
          @click="setTeamFilter(team.id)"
        >
          {{ team.name }} ({{ membersOfTeam(team.id) }})
        </button>
      </div>
    </div>

    <p v-if="displayedMembers.length === 0" class="empty-page">
      {{ members.length ? $t('admin.members.noResult') : $t('admin.members.empty') }}
    </p>

    <div v-else class="card">
      <div class="row head" aria-hidden="true">
        <span></span>
        <span>{{ $t('admin.members.colMember') }}</span>
        <span>{{ $t('admin.members.team') }}</span>
        <span>{{ $t('admin.members.colStatus') }}</span>
        <span></span>
      </div>
      <div
        v-for="member in displayedMembers"
        :key="member.id"
        class="row"
        :class="{ pending: member.isActive === false }"
      >
        <span class="avatar" :style="avatarStyle(member.trigramme)">{{ member.trigramme }}</span>
        <div class="who">
          <b>{{ member.name }}</b>
          <span v-if="member.isScrumMaster" class="pill sm">{{
            $t('admin.members.scrumMaster')
          }}</span>
          <span v-if="member.id === currentUserId" class="pill me">{{
            $t('admin.members.you')
          }}</span>
        </div>
        <span class="muted">{{ getTeamName(member.teamId) }}</span>
        <span>
          <!-- Statut affiché seulement si le serveur l'a fourni (true / false) -->
          <span
            v-if="typeof member.isActive === 'boolean'"
            class="pill"
            :class="member.isActive ? 'ok' : 'wait'"
            :title="member.isActive ? '' : $t('admin.members.pendingHint')"
          >
            {{ member.isActive ? $t('admin.members.active') : $t('admin.members.pending') }}
          </span>
        </span>
        <button type="button" class="btn btn-sec" @click="openForm(member)">
          {{ $t('common.edit') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Fenêtre d'ajout / de modification -->
  <div v-if="form" class="overlay" @click.self="closeForm">
    <form class="modal" @submit.prevent="saveForm">
      <template v-if="!confirmDelete">
        <h2>
          {{ form.id ? $t('admin.members.editTitle') : $t('admin.members.addTitle') }}
        </h2>

        <div class="grid-2">
          <div class="field">
            <label for="m-name">{{ $t('admin.members.fullName') }}</label>
            <input id="m-name" v-model="form.name" type="text" required @input="onNameInput" />
          </div>
          <div class="field">
            <label for="m-trigram">{{ $t('admin.members.trigram') }}</label>
            <input
              id="m-trigram"
              v-model="form.trigramme"
              type="text"
              maxlength="5"
              required
              @input="trigramTouched = true"
            />
          </div>
        </div>

        <div class="field">
          <label for="m-email">{{ $t('admin.members.email') }}</label>
          <!-- Email : obligatoire à l'ajout ; modifiable ensuite seulement si le compte n'est pas activé -->
          <template v-if="!form.id || !form.isActive">
            <input
              id="m-email"
              v-model="form.email"
              type="email"
              :required="!form.id"
              :placeholder="form.id ? $t('admin.members.emailKeep') : 'marie.dupont@entreprise.fr'"
            />
            <small v-if="form.id">{{ $t('admin.members.emailEditable') }}</small>
          </template>
          <p v-else class="locked">
            <i class="fa-solid fa-lock" aria-hidden="true"></i>
            {{ $t('admin.members.emailLocked') }}
          </p>
        </div>

        <div class="field">
          <label for="m-team">{{ $t('admin.members.team') }}</label>
          <select id="m-team" v-model="form.teamId" required>
            <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
          </select>
        </div>

        <label class="role" :class="{ disabled: isSelf }">
          <input v-model="form.isScrumMaster" type="checkbox" :disabled="isSelf" />
          <span>
            <b>{{ $t('admin.members.scrumMaster') }}</b>
            <small>{{
              isSelf ? $t('admin.members.selfRole') : $t('admin.members.scrumMasterHint')
            }}</small>
          </span>
        </label>

        <p v-if="!form.id" class="hint">{{ $t('admin.members.accessHint') }}</p>

        <div class="modal-actions">
          <button
            v-if="form.id && !isSelf"
            type="button"
            class="btn btn-danger left"
            @click="confirmDelete = true"
          >
            {{ $t('common.delete') }}
          </button>
          <button type="button" class="btn btn-sec" @click="closeForm">
            {{ $t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-pri" :disabled="saving">
            {{ form.id ? $t('common.save') : $t('admin.members.addSubmit') }}
          </button>
        </div>
      </template>

      <!-- Confirmation de suppression, dans la même fenêtre -->
      <template v-else>
        <h2>{{ $t('admin.members.confirmDeleteTitle', { name: form.name }) }}</h2>
        <p class="confirm-text">{{ $t('admin.members.confirmDeleteText') }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-sec" @click="confirmDelete = false">
            {{ $t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-danger-solid" @click="deleteMember">
            {{ $t('common.delete') }}
          </button>
        </div>
      </template>
    </form>
  </div>
</template>

<script>
import AdminService from './AdminService';
import authService from '@/services/authService';
import { suggestTrigram } from '@/utils/trigram';

// Couleurs des pastilles de trigramme (mêmes que la page Équipes)
const AVATAR_COLORS = [
  ['#eeedfe', '#3c3489'],
  ['#e1f5ee', '#085041'],
  ['#faece7', '#712b13'],
  ['#e6f1fb', '#0c447c'],
  ['#faeeda', '#633806'],
  ['#fbeaf0', '#72243e'],
];

export default {
  name: 'MembersManager',
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
      membersLimit: null,
      search: '',
      currentUserId: authService.getUser()?.id,
      form: null,
      trigramTouched: false,
      confirmDelete: false,
      saving: false,
    };
  },
  computed: {
    // Filtre par équipe porté par l'URL (lien « Gérer les membres » de la page Équipes)
    teamFilter() {
      return this.$route.query.team || '';
    },
    scrumMastersCount() {
      return this.members.filter((m) => m.isScrumMaster).length;
    },
    pendingCount() {
      return this.members.filter((m) => m.isActive === false).length;
    },
    displayedMembers() {
      const search = this.search.trim().toLowerCase();
      return this.members.filter(
        (member) =>
          (!this.teamFilter || member.teamId === this.teamFilter) &&
          (!search ||
            member.name.toLowerCase().includes(search) ||
            member.trigramme.toLowerCase().includes(search))
      );
    },
    isSelf() {
      return !!this.form?.id && this.form.id === this.currentUserId;
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    avatarStyle(trigramme = '') {
      const hash = [...trigramme].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const [background, color] = AVATAR_COLORS[hash % AVATAR_COLORS.length];
      return { background, color };
    },
    membersOfTeam(teamId) {
      return this.members.filter((m) => m.teamId === teamId).length;
    },
    setTeamFilter(teamId) {
      this.$router.replace({ query: teamId ? { team: teamId } : {} });
    },
    getTeamName(teamId) {
      const team = this.teams.find((t) => t.id === teamId);
      return team ? team.name : this.$t('admin.members.unknownTeam');
    },
    openForm(member) {
      this.confirmDelete = false;
      this.trigramTouched = !!member;
      this.form = member
        ? { ...member, email: '' }
        : {
            id: null,
            name: '',
            trigramme: '',
            email: '',
            teamId: this.teamFilter || this.teams[0]?.id || '',
            isScrumMaster: false,
            isActive: false,
          };
    },
    closeForm() {
      this.form = null;
      this.confirmDelete = false;
    },
    onNameInput() {
      // Trigramme proposé tant que l'utilisateur ne l'a pas saisi lui-même
      if (!this.trigramTouched) this.form.trigramme = suggestTrigram(this.form.name);
    },
    async saveForm() {
      const payload = {
        name: this.form.name.trim(),
        trigramme: this.form.trigramme.trim().toUpperCase(),
        teamId: this.form.teamId,
        isScrumMaster: this.form.isScrumMaster,
      };
      const email = this.form.email.trim();
      if (email) payload.email = email;

      this.saving = true;
      try {
        const result = this.form.id
          ? await AdminService.updateMember({ id: this.form.id, ...payload })
          : await AdminService.createMember(payload);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 5000);
          return;
        }
        this.$root.showToast(
          this.form.id
            ? this.$t('admin.members.toast.saved')
            : this.$t('admin.members.toast.created'),
          'success'
        );
        this.closeForm();
        await this.fetchMembers();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error', 5000);
      } finally {
        this.saving = false;
      }
    },
    async deleteMember() {
      const member = this.form;
      try {
        const result = await AdminService.deleteMember(member.id);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 5000);
          this.confirmDelete = false;
          return;
        }
        this.$root.showToast(this.$t('admin.members.toast.deleted'), 'success');
        this.closeForm();
        await this.fetchMembers();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error', 5000);
      }
    },
    async fetchMembers() {
      try {
        const resultMembers = await AdminService.getMembers();
        if (!resultMembers.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultMembers), 'error');
          return;
        }
        this.members = resultMembers.result.members;
        this.canAddMembers = resultMembers.result.membersRemaining === 1;
        this.membersLimit = resultMembers.result.membersLimit;
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
    async fetchData() {
      try {
        const resultTeams = await AdminService.getTeams();
        if (!resultTeams.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultTeams), 'error');
          return;
        }
        this.teams = resultTeams.result;
        await this.fetchMembers();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
  },
};
</script>

<style scoped>
/* Même gabarit que les pages rétros, sprints et équipes */
.members-content {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  /* La page occupe la hauteur disponible : seul le tableau défile, le haut reste visible */
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.members-content > * {
  flex: none;
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
  margin-bottom: 0.9rem;
}

.summary {
  color: #5b6669;
  font-weight: 600;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.search {
  position: relative;
  flex: 0 1 260px;
}

.search i {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa3a5;
  font-size: 0.85rem;
}

.search input {
  width: 100%;
  padding: 0.55rem 0.7rem 0.55rem 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
}

.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid #ece7da;
  background: #ffffff;
  color: #5b6669;
  border-radius: 999px;
  padding: 0.4rem 0.85rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.chip.on {
  background: #003d47;
  border-color: #003d47;
  color: #ffffff;
}

.empty-page {
  color: #6b7678;
  text-align: center;
  margin-top: 2rem;
}

.members-content > .card {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.card {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  overflow: hidden;
}

.row {
  display: grid;
  /* Colonne d'action à largeur fixe : chaque ligne est une grille indépendante,
     une largeur « auto » décalait l'en-tête (colonne vide) par rapport aux lignes */
  grid-template-columns: 40px minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) 110px;
  align-items: center;
  gap: 12px;
  padding: 0.7rem 1.2rem;
  border-top: 1px solid #f1ede3;
}

.row.head {
  position: sticky;
  top: 0;
  z-index: 1;
  border-top: 0;
  background: #f6f3ea;
  color: #6b7678;
  font-size: 0.82rem;
  font-weight: 600;
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
}

.row.pending {
  background: #fffaf0;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.row > .btn {
  justify-self: end;
}

.who {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.who b {
  color: #003d47;
  overflow-wrap: anywhere;
}

.muted {
  color: #6b7678;
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}

.pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

.pill.sm {
  background: #eeedfe;
  color: #3c3489;
}

.pill.me {
  background: #e6f0f2;
  color: #005a64;
}

.pill.ok {
  background: #eaf3de;
  color: #27500a;
}

.pill.wait {
  background: #faeeda;
  color: #633806;
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
  justify-content: center;
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

/* ===== Fenêtre ===== */
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
  max-width: 500px;
  max-height: 90vh;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 1.5rem 1.6rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.modal h2 {
  margin: 0 0 1.1rem;
  color: #002b36;
  font-size: 1.3rem;
}

.grid-2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 100px;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.9rem;
}

.field label {
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #333;
}

.field input,
.field select {
  padding: 0.55rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  min-width: 0;
  background: #ffffff;
}

.field input:focus,
.field select:focus,
.search input:focus {
  border-color: #002b36;
  outline: none;
  box-shadow: 0 0 4px #002b3666;
}

.field small,
.locked {
  color: #6b7678;
  font-size: 0.85rem;
  margin: 0.35rem 0 0;
}

.locked {
  margin: 0;
  background: #f6f3ea;
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
}

.role {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  border: 1px solid #ece7da;
  border-radius: 8px;
  padding: 0.7rem 0.8rem;
  cursor: pointer;
}

.role.disabled {
  cursor: default;
  background: #fcfbf7;
}

.role input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  flex-shrink: 0;
}

.role span {
  display: flex;
  flex-direction: column;
}

.role b {
  color: #003d47;
}

.role small {
  color: #6b7678;
  font-size: 0.85rem;
}

.hint {
  color: #0c447c;
  background: #e6f0f2;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  font-size: 0.88rem;
  margin: 0.9rem 0 0;
}

.confirm-text {
  color: #5b6669;
  margin: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1ede3;
}

.modal-actions .left {
  margin-right: auto;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  /* Sur mobile, toute la page défile (zone de défilement trop étroite sinon) */
  .members-content {
    display: block;
  }

  .members-content > .card {
    overflow-y: visible;
  }

  /* Ligne en flex : nom et bouton en haut, équipe et statut en dessous */
  .row {
    display: flex;
    flex-wrap: wrap;
    row-gap: 6px;
  }

  .row .who {
    flex: 1 1 0;
  }

  .row > .btn {
    order: 1;
  }

  .row > .muted,
  .row > span:nth-child(4) {
    order: 2;
    margin-left: 52px;
  }

  .row > .muted {
    flex-basis: calc(100% - 52px);
  }

  .row.head {
    display: none;
  }

  .search {
    flex: 1 1 100%;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 1.1rem 1rem;
  }

  .grid-2 {
    grid-template-columns: minmax(0, 1fr) 80px;
  }

  .modal-actions {
    flex-wrap: wrap;
  }

  .modal-actions .btn {
    flex: 1 1 auto;
  }
}
</style>
