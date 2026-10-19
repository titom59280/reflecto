<template>
  <div class="admin-header">
    <router-link to="/retro" class="back-admin-button">← {{ $t('common.back') }}</router-link>
    <h1 class="page-title">{{ $t('admin.dashboard.title') }}</h1>
  </div>
  <div class="container-admin">
    <div class="dashboard">
      <!-- KPI -->
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
          <span class="kpi-label">{{ kpi.label }}</span>
          <span class="kpi-value">{{ kpi.value ?? '–' }}</span>
        </div>
      </div>

      <!-- Bento -->
      <div class="bento">
        <router-link to="/admin/retros" class="hero-card">
          <span class="icon-tile icon-hero"><i class="fa-solid fa-comments"></i></span>
          <div>
            <span class="hero-title">{{ $t('admin.dashboard.manageRetros') }}</span>
            <span class="hero-desc">{{ $t('admin.dashboard.manageRetrosDesc') }}</span>
            <span class="hero-cta"
              ><i class="fa-solid fa-plus"></i> {{ $t('admin.dashboard.newRetro') }}</span
            >
          </div>
        </router-link>

        <router-link
          v-for="(link, i) in links"
          :key="link.to"
          :to="link.to"
          class="tile-card"
          :class="{ wide: links.length % 2 === 1 && i === links.length - 1 }"
        >
          <span class="icon-tile" :class="link.color"><i :class="link.icon"></i></span>
          <span class="tile-title">{{ link.label }}</span>
          <i class="fa-solid fa-arrow-right tile-arrow"></i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService';
import AdminService from '@/admin/AdminService';

export default {
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      isFullAdmin: false,
      stats: {
        companies: null,
        teams: null,
        members: null,
        activeSprints: null,
        openRetros: null,
      },
    };
  },
  computed: {
    kpis() {
      const kpis = [];
      if (this.isFullAdmin)
        kpis.push({ label: this.$t('admin.dashboard.kpi.companies'), value: this.stats.companies });
      kpis.push(
        { label: this.$t('admin.dashboard.kpi.teams'), value: this.stats.teams },
        { label: this.$t('admin.dashboard.kpi.members'), value: this.stats.members },
        { label: this.$t('admin.dashboard.kpi.activeSprints'), value: this.stats.activeSprints },
        { label: this.$t('admin.dashboard.kpi.openRetros'), value: this.stats.openRetros }
      );
      return kpis;
    },
    links() {
      const links = [
        {
          to: '/admin/sprints',
          label: this.$t('admin.dashboard.links.sprints'),
          icon: 'fa-solid fa-stopwatch',
          color: 'amber',
        },
        {
          to: '/admin/teams',
          label: this.$t('admin.dashboard.links.teams'),
          icon: 'fa-solid fa-users',
          color: 'purple',
        },
        {
          to: '/admin/members',
          label: this.$t('admin.dashboard.links.members'),
          icon: 'fa-solid fa-user',
          color: 'coral',
        },
      ];
      if (this.isFullAdmin) {
        links.push({
          to: '/admin/companies',
          label: this.$t('admin.dashboard.links.companies'),
          icon: 'fa-solid fa-building',
          color: 'blue',
        });
      }
      return links;
    },
  },
  mounted() {
    this.checkFullAdmin();
    this.fetchStats();
  },
  methods: {
    checkFullAdmin() {
      const user = authService.getUser();
      this.isFullAdmin = !!user?.isFullAdmin;
    },
    async fetchStats() {
      // Chaque KPI est indépendant : un échec n'empêche pas l'affichage des autres
      const safe = (promise) => promise.catch(() => null);
      const [companies, teams, members, sprints, links] = await Promise.all([
        // /companies est réservé aux full admins côté API
        this.isFullAdmin ? safe(AdminService.getCompanies()) : null,
        safe(AdminService.getTeams()),
        safe(AdminService.getMembers()),
        safe(AdminService.getSprints()),
        safe(AdminService.getSprintRetroLinks()),
      ]);

      if (companies?.isSuccess) this.stats.companies = companies.result.length;
      if (teams?.isSuccess) this.stats.teams = teams.result.length;
      if (members?.isSuccess) this.stats.members = members.result.members.length;
      if (sprints?.isSuccess) {
        this.stats.activeSprints = sprints.result.filter((s) => s.isActif && !s.isClosed).length;
      }
      if (links?.isSuccess) {
        this.stats.openRetros = links.result.filter((l) => !l.isClosed && !l.isRetroDone).length;
      }
    },
  },
};
</script>

<style scoped>
.container-admin {
  overflow: auto;
  height: 100%;
}

.dashboard {
  max-width: 820px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeUp 0.35s ease;
}

/* ===== KPI ===== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 14px;
  padding: 0.9rem 1rem;
}

.kpi-label {
  font-size: 0.85rem;
  color: #6b7678;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #003d47;
  line-height: 1.1;
}

/* ===== Bento ===== */
.bento {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  grid-auto-rows: minmax(84px, auto);
  gap: 0.75rem;
}

.hero-card,
.tile-card {
  text-decoration: none;
  border-radius: 14px;
  transition: all 0.25s ease;
}

.hero-card {
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  background: #003d47;
  color: #ffffff;
  padding: 1.25rem;
}

.hero-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0, 61, 71, 0.25);
}

.hero-title {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
}

.hero-desc {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #b8cfd2;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  background: #ffffff;
  color: #003d47;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
}

.tile-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #ffffff;
  border: 1px solid #ece7da;
  padding: 1rem 1.1rem;
  color: #003d47;
}

.tile-card:hover {
  transform: translateY(-3px);
  border-color: #003d47;
  box-shadow: 0 6px 14px rgba(0, 61, 71, 0.08);
}

.tile-card.wide {
  grid-column: span 2;
}

.tile-title {
  flex: 1;
  font-weight: 600;
  font-size: 1.05rem;
}

.tile-arrow {
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s ease;
}

.tile-card:hover .tile-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ===== Icônes ===== */
.icon-tile {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.icon-hero {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}
.icon-tile.amber {
  background: #faeeda;
  color: #854f0b;
}
.icon-tile.purple {
  background: #eeedfe;
  color: #534ab7;
}
.icon-tile.coral {
  background: #faece7;
  color: #993c1d;
}
.icon-tile.blue {
  background: #e6f1fb;
  color: #185fa5;
}

/* ===== Responsive ===== */
@media (max-width: 700px) {
  .bento {
    grid-template-columns: 1fr;
  }
  .hero-card {
    grid-row: auto;
  }
  .tile-card.wide {
    grid-column: auto;
  }
}

/* ===== Animation d’apparition ===== */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
