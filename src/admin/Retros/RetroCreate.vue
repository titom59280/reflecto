<template>
  <form class="retro-form form-container" @submit.prevent="createRetro">
    <p v-if="messageError" class="message">{{ messageError }}</p>

    <div class="form-group">
      <label>Nom de la rétro</label>
      <input v-model="newRetro.name" type="text" required />
    </div>

    <div class="categories-container">
      <div class="categories">
        <div v-for="(cat, index) in newRetro.categories" :key="index" class="category-group">
          <div class="form-group">
            <div class="retro-header">
              <label>Nom</label>
              <button type="button" class="delete" @click="removeCategory(index)">🗑️</button>
            </div>
            <input v-model="cat.name" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input v-model="cat.description" required />
          </div>
          <div v-if="companie && companie.subscriptionLevel == 2" class="form-group">
            <label>Image</label>
            <input type="file" @change="handleImageUpload($event, index)" />
          </div>
        </div>
      </div>
      <button type="button" class="add-btn" @click="addCategory">Ajouter une catégorie</button>
    </div>

    <button type="submit" class="submit-btn">Créer la rétro</button>
  </form>
</template>

<script>
import AdminService from './../AdminService';

export default {
  props: {
    teams: {
      type: Array,
      default: () => [],
    },
    sprints: {
      type: Array,
      default: () => [],
    },
    links: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['refresh'],
  data() {
    return {
      newRetro: {
        name: '',
        categories: [{ name: '', description: '', image: null }],
      },
      selectedTeamId: '',
      selectedSprintId: '',
      messageError: '',
      companie: null,
    };
  },
  computed: {
    availableSprints() {
      return this.sprints.filter((s) => !s.isClosed);
    },
  },
  mounted() {
    this.fetchCompany();
  },
  methods: {
    async fetchCompany() {
      const resultCompanie = await AdminService.getCompanie();
      if (!resultCompanie.isSuccess) {
        this.$root.showToast(resultCompanie.message, 'error');
        return;
      }
      this.companie = resultCompanie.result;
    },
    addCategory() {
      this.newRetro.categories.push({ name: '', description: '', image: null });
    },
    removeCategory(index) {
      this.newRetro.categories.splice(index, 1);
    },
    handleImageUpload(event, index) {
      const file = event.target.files[0];
      if (file) {
        this.newRetro.categories[index].image = file;
      }
    },
    async createRetro() {
      const formData = new FormData();
      formData.append('name', this.newRetro.name);

      this.newRetro.categories.forEach((cat, index) => {
        formData.append(`categories[${index}][name]`, cat.name);
        formData.append(`categories[${index}][description]`, cat.description);
        if (cat.image) {
          formData.append(`categories[${index}][image]`, cat.image);
        }
      });

      try {
        const alreadyLinked = this.links.some(
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

        const result = await AdminService.createRetro(formData);
        await AdminService.createRetroToSprint(
          result.id,
          this.selectedSprintId,
          this.selectedTeamId
        );
        this.$root.showToast('Rétro créée avec succès', 'success');
        this.resetForm();
        this.$emit('refresh');
      } catch (err) {
        this.messageError =
          err.response?.data?.message || 'Erreur lors de la création de la rétro.';
      }
    },
    resetForm() {
      this.newRetro = {
        name: '',
        categories: [{ name: '', description: '', image: null }],
      };
      this.selectedTeamId = '';
      this.selectedSprintId = '';
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
  height: 100%;
  overflow: auto;
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

.categories-container {
  overflow: auto;
  max-height: 400px;
}
</style>
