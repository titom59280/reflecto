<template>
  <div class="retro-form retro-container">
    <div class="form-group">
      <label>Rétro</label>
      <select v-model="selectedRetroId">
        <option disabled value="">Choisir une rétro</option>
        <option v-for="retro in retros" :key="retro.id" :value="retro.id">{{ retro.name }}</option>
      </select>
    </div>

    <div class="form-group">
      <label>Sprint</label>
      <select v-model="selectedSprintId">
        <option disabled value="">Choisir un sprint</option>
        <option
          v-for="sprint in sprints.filter((s) => !s.isRetroDone)"
          :key="sprint.id"
          :value="sprint.id"
        >
          {{ sprint.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>Équipe</label>
      <select v-model="selectedTeamId">
        <option disabled value="">Choisir une équipe</option>
        <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.teamName }}</option>
      </select>
    </div>
  </div>
  <button @click="associateRetro">Associer</button>
</template>

<script>
import AdminService from './../AdminService';

export default {
  props: {
    retros: {
      type: Array,
      default: () => [],
    },
    sprints: {
      type: Array,
      default: () => [],
    },
    teams: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['refresh-links'],
  data() {
    return {
      selectedRetroId: '',
      selectedSprintId: '',
      selectedTeamId: '',
    };
  },
  methods: {
    async associateRetro() {
      if (!this.selectedRetroId || !this.selectedSprintId || !this.selectedTeamId) {
        this.$root.showToast('Veuillez sélectionner tous les champs', 'error');
        return;
      }

      const alreadyLinked = this.$parent.links?.some(
        (link) => link.sprintId === this.selectedSprintId && link.teamId === this.selectedTeamId
      );

      if (alreadyLinked) {
        this.$root.showToast(
          'Une rétro est déjà associée à cette équipe pour ce sprint',
          'error',
          5000
        );
        return;
      }

      try {
        await AdminService.createRetroToSprint(
          this.selectedRetroId,
          this.selectedSprintId,
          this.selectedTeamId
        );
        this.$emit('refresh-links');
        this.selectedRetroId = '';
        this.selectedSprintId = '';
        this.selectedTeamId = '';
        this.$root.showToast('Rétro associée au sprint', 'success');
      } catch (err) {
        this.$root.showToast(err.response?.data?.message || "Erreur d'association", 'error', 5000);
      }
    },
  },
};
</script>

<style scoped>
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
</style>
