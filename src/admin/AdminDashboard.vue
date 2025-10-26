<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button"> ← Retour </router-link>
    <h1 class="page-title">Administration</h1>
  </div>
  <div>
    <div class="admin-content">
      <div class="container">
        <ul class="admin-links">
          <li v-if="!isFullAdmin">
            <router-link to="/admin/companies" class="card-link">
              <span class="icon">🏢</span>
              <span>Gérer les compagnies</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/teams" class="card-link">
              <span class="icon">👥</span>
              <span>Gérer les équipes</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/members" class="card-link">
              <span class="icon">🙋</span>
              Gérer les membres
            </router-link>
          </li>
          <li>
            <router-link to="/admin/sprints" class="card-link">
              <span class="icon">⏱️</span>
              <span>Gérer les sprints</span>
            </router-link>
          </li>
          <li>
            <router-link to="/admin/retros" class="card-link">
              <span class="icon">💬</span>
              <span>Gérer les rétros</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService';

export default {
  data() {
    return {
      isFullAdmin: false,
    };
  },
  mounted() {
    this.checkFullAdmin();
  },
  methods: {
    checkFullAdmin() {
      const user = authService.getUser();
      this.isFullAdmin = user.isFullAdmin;
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 300px;
  margin: auto;
  padding: 2rem;
  background-color: unset;
  box-shadow: unset;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin: 10px 0;
}

.title {
  text-align: center;
}

.admin-links {
  display: grid;
  list-style: none;
  padding: 0;
  margin: 0;
}

.card-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  text-decoration: none;
  color: #003d47;
  font-weight: 600;
  font-size: 1.05rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.25s ease;
}

.card-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  background: #003d47;
  color: #ffffff;
}

.card-link .icon {
  font-size: 1.6rem;
}

/* Accent sur un élément particulier */
.card-link.accent .icon {
  color: #ff9800;
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
