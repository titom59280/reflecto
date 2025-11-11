<template>
  <header class="app-header">
    <div class="left-section">
      <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
      <span class="title" @click="goToAccueil">Reflecto</span>
    </div>

    <div v-if="afficheEquipe" class="middle-section">
      <div class="team-selector middle-section">
        <select
          v-if="isScrumMaster && teams.length > 1"
          id="teamSelect"
          v-model="selectedTeamId"
          @change="emitTeamChange"
        >
          <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
        </select>
        <span v-else class="team-name">{{ currentTeamName }}</span>
      </div>
    </div>
    <div class="right-section">
      <div ref="dropdown" class="menu-wrapper menuContextuel">
        <button class="hamburger" @click="toggleMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div v-if="menuOpen" class="menu-dropdown">
          <button class="menu-item" @click="goToRetro"><i class="icon">💬</i> Rétro</button>
          <button v-if="user.isScrumMaster" class="menu-item" @click="goToAdministration">
            <i class="icon">⚙️</i> Administration
          </button>
          <button class="menu-item logout" @click="logout">
            <i class="icon">🚪</i> Déconnexion
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import authService from '@/services/authService';
import retroService from '@/services/retroService';

export default {
  emits: ['team-changed'],
  data() {
    return {
      teams: [],
      user: authService.getUser(),
      isScrumMaster: false,
      menuOpen: false,
      selectedTeamId: '',
      currentTeamName: '',
    };
  },
  computed: {
    isAdminRoute() {
      return this.$route.path.startsWith('/admin');
    },
    afficheEquipe() {
      return this.user && this.teams.length > 0 && !this.$route.path.startsWith('/admin');
    },
  },
  async created() {
    if (!this.user) {
      this.logout();
      return;
    }
    this.isScrumMaster = this.user.isScrumMaster;
    const resultTeams = await retroService.getTeams();

    if (!resultTeams.isSuccess) {
      return;
    }
    this.teams = resultTeams.result;
    if (!this.isScrumMaster || this.teams.length === 1) {
      const team = this.teams.find((t) => t.id === this.user.teamId);
      this.currentTeamName = team?.name || 'Inconnue';
      return;
    }

    this.selectedTeamId = this.user.teamId;
    this.emitTeamChange();
  },
  methods: {
    emitTeamChange() {
      this.$emit('team-changed', this.selectedTeamId);
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      if (this.menuOpen) {
        // Retarde l'ajout de l'écouteur pour éviter la fermeture immédiate
        setTimeout(() => {
          document.addEventListener('click', this.handleClickOutside);
        }, 0);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    goToRetro() {
      this.$router.push('/retro');
      this.closeMenu();
    },
    goToAccueil() {
      this.$router.push('/');
    },
    goToAdministration() {
      this.$router.push('/admin');
      this.closeMenu();
    },
    closeMenu() {
      this.menuOpen = false;
      document.removeEventListener('click', this.handleClickOutside);
    },
    logout() {
      authService.logout();
      this.$router.push('/');
      this.closeMenu();
    },
    handleClickOutside(event) {
      const dropdown = this.$refs.dropdown;
      if (dropdown && !dropdown.contains(event.target)) {
        this.closeMenu();
      }
    },
    destroyed() {
      document.removeEventListener('click', this.handleClickOutside);
    },
  },
};
</script>

<style scoped>
.app-header {
  background-color: #042f3a;
  padding: 0.7rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-header .right-section {
  display: flex;
}

i {
  font-style: normal;
}
.left-section {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
}
.logo {
  background-image: url('@/assets/logo.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.title {
  padding-left: 8px;
  flex: 1;
  font-weight: 700;
  font-size: 1.5rem;
}

.right-section {
  position: relative;
}
.menu-wrapper {
  position: relative;
  display: inline-block;
}

/* Hamburger Button */
.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
}
.hamburger span {
  width: 24px;
  height: 3px;
  background-color: white;
  border-radius: 2px;
}

/* Dropdown Menu */
.menu-dropdown {
  position: absolute;
  top: 100%; /* directly below the button */
  right: 0;
  margin-top: 8px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 12px;
  min-width: 200px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  background: none;
  border: none;
  padding: 10px;
  font-size: 15px;
  text-align: left;
  border-radius: 8px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s;
}
.menu-item:hover {
  background-color: #e6f0f5;
  color: #04344f;
  cursor: pointer;
}

.logout {
  background-color: #04344f;
  color: white;
}
.logout:hover {
  background-color: #04344f; /* same on hover */
  color: white;
}
/* Animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.app-header {
  background-color: #002b36;
  color: white;
  padding: 0.7rem 2rem;
  border-bottom: 4px solid #005f73;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  height: 30px;
}

.team-selector select {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='20,50 70,100 120,50' stroke='white' stroke-width='16' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.team-selector select:hover {
  background-color: #02677a;
}

.team-selector select:focus {
  outline: none;
  box-shadow: 0 0 0 2px #4dd0e1;
}

.menu {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  font-weight: 500;
}

.menu .icon {
  margin-right: 6px;
}
.team-selector span {
  cursor: default;
}
.team-selector select,
.team-selector span {
  background-color: #014d64;
  color: white;
  padding: 0.5rem 2rem 0.5rem 0.8rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  appearance: none;
  background-repeat: no-repeat;
  background-position: right 0.8rem center;
  background-size: 1rem;
}
.team-selector select:hover {
  background-color: #02677a;
}

.logo,
.title {
  cursor: pointer;
}
</style>
