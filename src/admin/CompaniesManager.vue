<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button">← {{ $t('common.back') }}</router-link>
    <h1 class="page-title">{{ $t('admin.platform.title') }}</h1>
  </div>

  <div class="companies-content tab-content-animated">
    <!-- Indicateurs de toute la plateforme -->
    <div class="kpis">
      <div v-for="kpi in kpis" :key="kpi.key" class="kpi" :class="{ warn: kpi.warn }">
        <span>{{ $t(`admin.platform.kpi.${kpi.key}`) }}</span>
        <b>{{ kpi.value ?? '–' }}</b>
      </div>
    </div>

    <div v-if="companies.length" class="plans">
      <span class="plans-title">{{ $t('admin.platform.plans') }}</span>
      <div class="plans-bar" aria-hidden="true">
        <span
          v-for="level in LEVELS"
          v-show="countByLevel(level)"
          :key="level"
          :class="`bar-${level}`"
          :style="{ flexGrow: countByLevel(level) }"
        ></span>
      </div>
      <div class="plans-legend">
        <span v-for="level in LEVELS" :key="level">
          <span class="pill" :class="`level-${level}`">{{ levelLabel(level) }}</span>
          {{ countByLevel(level) }}
        </span>
      </div>
    </div>

    <div class="toolbar">
      <div class="filters">
        <div class="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <label for="company-search" class="sr-only">{{ $t('admin.companies.search') }}</label>
          <input
            id="company-search"
            v-model="search"
            type="search"
            :placeholder="$t('admin.companies.search')"
          />
        </div>
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="chip"
          :class="{ on: filter === f.key, warn: f.key === 'over' }"
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
      </div>
      <button type="button" class="btn btn-pri" @click="openCreate">
        <i class="fa-solid fa-plus" aria-hidden="true"></i> {{ $t('admin.companies.create') }}
      </button>
    </div>

    <p v-if="displayedCompanies.length === 0" class="empty-page">
      {{ companies.length ? $t('admin.companies.noResult') : $t('admin.companies.empty') }}
    </p>

    <div v-else class="card">
      <div class="row head" aria-hidden="true">
        <span>{{ $t('admin.companies.colCompany') }}</span>
        <span>{{ $t('admin.companies.colPlan') }}</span>
        <span>{{ $t('admin.companies.colTeams') }}</span>
        <span>{{ $t('admin.companies.colMembers') }}</span>
        <span>{{ $t('admin.platform.colActivity') }}</span>
        <span></span>
      </div>
      <div
        v-for="company in displayedCompanies"
        :key="company.id"
        class="row"
        :class="{ over: isOverLimit(company) }"
      >
        <b class="name">{{ company.name }}</b>
        <span>
          <span class="pill" :class="`level-${company.subscriptionLevel}`">
            {{ levelLabel(company.subscriptionLevel) }}
          </span>
        </span>
        <span :class="usageClass(company.teamsCount, maxTeams(company))">
          {{ usage(company.teamsCount, maxTeams(company)) }}
        </span>
        <span :class="usageClass(company.membersCount, maxMembers(company))">
          {{ usage(company.membersCount, maxMembers(company)) }}
          <template v-if="company.membersCount > maxMembers(company)">
            · {{ $t('admin.companies.overLimit') }}
          </template>
        </span>
        <span class="usage" :class="{ idle: !isActive(company) }">
          {{ activityLabel(company.lastActivity) }}
        </span>
        <button type="button" class="btn btn-sec" @click="openEdit(company)">
          {{ $t('common.edit') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Fenêtre de création / modification -->
  <div v-if="form" class="overlay" @click.self="form = null">
    <form class="modal" @submit.prevent="saveForm">
      <h2>{{ form.id ? $t('admin.companies.editTitle') : $t('admin.companies.createTitle') }}</h2>

      <div class="grid-2">
        <div class="field">
          <label for="c-name">{{ $t('admin.companies.name') }}</label>
          <input id="c-name" v-model="form.companyName" type="text" required />
        </div>
        <div v-if="!form.id" class="field">
          <label for="c-team">{{ $t('admin.companies.firstTeam') }}</label>
          <input id="c-team" v-model="form.teamName" type="text" required />
        </div>
      </div>

      <template v-if="!form.id">
        <p class="section-label">{{ $t('admin.members.scrumMaster') }}</p>
        <div class="grid-sm">
          <div class="field">
            <label for="c-sm-name">{{ $t('admin.companies.scrumMasterName') }}</label>
            <input
              id="c-sm-name"
              v-model="form.scrumMasterName"
              type="text"
              required
              @input="onScrumMasterNameInput"
            />
          </div>
          <div class="field">
            <label for="c-sm-trigram">{{ $t('admin.companies.scrumMasterTrigram') }}</label>
            <input
              id="c-sm-trigram"
              v-model="form.scrumMasterTrigramme"
              type="text"
              maxlength="5"
              required
              @input="trigramTouched = true"
            />
          </div>
        </div>
        <div class="field">
          <label for="c-sm-email">{{ $t('admin.companies.scrumMasterEmail') }}</label>
          <input id="c-sm-email" v-model="form.scrumMasterEmail" type="email" required />
        </div>
      </template>

      <p class="section-label">{{ $t('admin.companies.subscriptionLevel') }}</p>
      <div class="levels" role="radiogroup">
        <button
          v-for="level in LEVELS"
          :key="level"
          type="button"
          role="radio"
          class="chip"
          :class="{ on: form.subscriptionLevel === level }"
          :aria-checked="form.subscriptionLevel === level"
          @click="form.subscriptionLevel = level"
        >
          {{ levelLabel(level) }}
        </button>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-sec" @click="form = null">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn btn-pri" :disabled="saving">
          {{ form.id ? $t('common.save') : $t('admin.companies.createSubmit') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import AdminService from './AdminService';
import { suggestTrigram } from '@/utils/trigram';

const LEVELS = ['0', '1', '2'];
const ACTIVE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
// Limites par offre, identiques au serveur et à la page des tarifs
const MAX_TEAMS = { 0: 1, 1: 1, 2: Infinity };
const MAX_MEMBERS = { 0: 3, 1: 5, 2: Infinity };

export default {
  name: 'CompaniesManager',
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      LEVELS,
      companies: [],
      platformStats: {},
      search: '',
      filter: 'all',
      form: null,
      trigramTouched: false,
      saving: false,
    };
  },
  computed: {
    filters() {
      return [
        { key: 'all', label: this.$t('admin.companies.filterAll') },
        ...LEVELS.map((level) => ({ key: level, label: this.levelLabel(level) })),
        {
          key: 'over',
          label: this.$t('admin.companies.filterOver', { count: this.overLimitCount }),
        },
        { key: 'inactive', label: this.$t('admin.platform.filterInactive') },
      ];
    },
    kpis() {
      return [
        { key: 'companies', value: this.companies.length },
        { key: 'active', value: this.companies.filter((c) => this.isActive(c)).length },
        { key: 'members', value: this.platformStats.members },
        { key: 'inactiveMembers', value: this.platformStats.inactiveMembers },
        { key: 'openRetros', value: this.platformStats.openRetros },
        { key: 'over', value: this.overLimitCount, warn: this.overLimitCount > 0 },
      ];
    },
    overLimitCount() {
      return this.companies.filter((c) => this.isOverLimit(c)).length;
    },
    displayedCompanies() {
      const search = this.search.trim().toLowerCase();
      return this.companies.filter((company) => {
        if (search && !company.name.toLowerCase().includes(search)) return false;
        if (this.filter === 'over') return this.isOverLimit(company);
        if (this.filter === 'inactive') return !this.isActive(company);
        if (this.filter !== 'all') return String(company.subscriptionLevel) === this.filter;
        return true;
      });
    },
  },
  mounted() {
    this.fetchCompanies();
  },
  methods: {
    // Libellés alignés sur la page des tarifs (Gratuit / Standard / Pro)
    levelLabel(level) {
      return this.$t(
        { 0: 'nosOffres.free', 1: 'nosOffres.standard', 2: 'nosOffres.pro' }[level] ||
          'nosOffres.free'
      );
    },
    // Activité = création d'un sprint ; « active » si un sprint a été créé dans les 30 derniers jours
    isActive(company) {
      if (!company.lastActivity) return false;
      return Date.now() - new Date(company.lastActivity).getTime() <= ACTIVE_DAYS * DAY_MS;
    },
    activityLabel(date) {
      if (!date) return this.$t('admin.platform.noActivity');
      const days = Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);
      return new Intl.RelativeTimeFormat(this.$i18n.locale, { numeric: 'auto' }).format(
        -days,
        'day'
      );
    },
    countByLevel(level) {
      return this.companies.filter((c) => String(c.subscriptionLevel) === level).length;
    },
    maxTeams(company) {
      return MAX_TEAMS[company.subscriptionLevel] ?? 1;
    },
    maxMembers(company) {
      return MAX_MEMBERS[company.subscriptionLevel] ?? 3;
    },
    isOverLimit(company) {
      return (
        company.teamsCount > this.maxTeams(company) ||
        company.membersCount > this.maxMembers(company)
      );
    },
    usage(count, max) {
      return Number.isFinite(max)
        ? `${count} / ${max}`
        : `${count} · ${this.$t('admin.companies.unlimited')}`;
    },
    usageClass(count, max) {
      return count > max ? 'usage over' : 'usage';
    },
    openCreate() {
      this.trigramTouched = false;
      this.form = {
        id: null,
        companyName: '',
        teamName: '',
        scrumMasterName: '',
        scrumMasterTrigramme: '',
        scrumMasterEmail: '',
        subscriptionLevel: '0',
      };
    },
    openEdit(company) {
      this.form = {
        id: company.id,
        companyName: company.name,
        subscriptionLevel: String(company.subscriptionLevel),
      };
    },
    onScrumMasterNameInput() {
      if (!this.trigramTouched) {
        this.form.scrumMasterTrigramme = suggestTrigram(this.form.scrumMasterName);
      }
    },
    async saveForm() {
      this.saving = true;
      try {
        const result = this.form.id
          ? await AdminService.updateCompany(
              this.form.id,
              this.form.companyName.trim(),
              this.form.subscriptionLevel
            )
          : await AdminService.createCompany({
              companyName: this.form.companyName.trim(),
              teamName: this.form.teamName.trim(),
              scrumMasterName: this.form.scrumMasterName.trim(),
              scrumMasterTrigramme: this.form.scrumMasterTrigramme.trim().toUpperCase(),
              scrumMasterEmail: this.form.scrumMasterEmail.trim(),
              subscriptionLevel: this.form.subscriptionLevel,
            });
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 5000);
          return;
        }
        this.$root.showToast(
          this.form.id
            ? this.$t('admin.companies.toast.saved')
            : this.$t('admin.companies.toast.created'),
          'success'
        );
        this.form = null;
        await this.fetchCompanies();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error', 5000);
      } finally {
        this.saving = false;
      }
    },
    async fetchCompanies() {
      try {
        const resCompanies = await AdminService.getCompanies();
        if (!resCompanies.isSuccess) {
          this.$root.showToast(this.$apiMessage(resCompanies), 'error');
          return;
        }
        this.companies = resCompanies.result;
        const resStats = await AdminService.getPlatformStats();
        if (resStats.isSuccess) this.platformStats = resStats.result;
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
  },
};
</script>

<style scoped>
/* Même gabarit que les autres pages d'administration : seule la liste défile */
.companies-content {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.companies-content > * {
  flex: none;
}

.companies-content > .card {
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

.kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi {
  /* Indicateur non cliquable : curseur standard, pas de curseur texte */
  cursor: default;
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 14px;
  padding: 0.8rem 1rem;
}

.kpi span {
  display: block;
  color: #6b7678;
  font-size: 0.88rem;
}

.kpi b {
  font-size: 1.6rem;
  color: #003d47;
}

.kpi.warn {
  border-color: #ef9f27;
  background: #fffaf0;
}

.kpi.warn b {
  color: #854f0b;
}

.plans {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 14px;
  padding: 0.8rem 1rem;
  margin-bottom: 1rem;
  cursor: default;
}

.plans-title {
  display: block;
  color: #6b7678;
  font-size: 0.88rem;
  margin-bottom: 0.5rem;
}

.plans-bar {
  display: flex;
  gap: 3px;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.plans-bar span {
  flex-basis: 0;
}

.bar-0 {
  background: #d3d1c7;
}

.bar-1 {
  background: #85b7eb;
}

.bar-2 {
  background: #afa9ec;
}

.plans-legend {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 0.55rem;
  color: #5b6669;
  font-size: 0.9rem;
}

.usage.idle {
  color: #9aa3a5;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.search {
  position: relative;
  width: 220px;
  margin-right: 4px;
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

.chip.warn {
  color: #633806;
  border-color: #ef9f27;
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
  grid-template-columns: minmax(0, 1.4fr) 100px 110px minmax(0, 1.1fr) minmax(0, 1fr) 110px;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1.2rem;
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

.row.over {
  background: #fffaf0;
}

.row > .btn {
  justify-self: end;
}

.name {
  color: #003d47;
  overflow-wrap: anywhere;
}

.pill {
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
}

.level-0 {
  background: #f1efe8;
  color: #444441;
}

.level-1 {
  background: #e6f1fb;
  color: #0c447c;
}

.level-2 {
  background: #eeedfe;
  color: #3c3489;
}

.usage {
  color: #6b7678;
  font-size: 0.92rem;
}

.usage.over {
  color: #854f0b;
  font-weight: 600;
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
  max-width: 520px;
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.grid-sm {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 100px;
  gap: 0.75rem;
}

.section-label {
  margin: 0.4rem 0 0.6rem;
  font-weight: 700;
  color: #003d47;
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
  font-size: 0.95rem;
}

.field input {
  padding: 0.55rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  min-width: 0;
}

.field input:focus,
.search input:focus {
  border-color: #002b36;
  outline: none;
  box-shadow: 0 0 4px #002b3666;
}

.levels {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1ede3;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .companies-content {
    display: block;
  }

  .companies-content > .card {
    overflow-y: visible;
  }

  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search {
    width: 100%;
    margin-right: 0;
  }

  .row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .row.head {
    display: none;
  }

  /* Offre, équipes et membres passent sous le nom */
  .row > span {
    grid-column: 1 / 2;
  }

  .row > .btn {
    grid-column: 2;
    grid-row: 1;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 1.1rem 1rem;
  }

  .modal-actions .btn {
    flex: 1 1 auto;
  }
}
</style>
