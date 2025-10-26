<template>
  <div class="admin-header">
    <router-link to="/admin" class="back-admin-button"> ← Retour </router-link>
    <h1 class="page-title">Gérer les compagnies</h1>
  </div>
  <AdminTabs :tabs="tabLabels">
    <template #tab-0>
      <div class="Company-form form-container tab-content-animated">
        <div class="form-group">
          <label>Nom de la compagnie</label>
          <input v-model="companyName" type="text" />
        </div>
        <div class="form-group">
          <label>Nom du Scrum Master</label>
          <input v-model="scrumMasterEmail" type="text" />
        </div>
        <div class="form-group">
          <label>Email du Scrum Master</label>
          <input v-model="scrumMasterName" type="text" />
        </div>
        <div class="form-group">
          <label>Trigramme du Scrum Master</label>
          <input v-model="scrumMasterTrigramme" type="text" />
        </div>
        <div class="form-group">
          <label>Niveau de subscription</label>
          <select v-model="subscriptionLevel">
            <option value="0">Gratuit</option>
            <option value="1">Basic</option>
            <option value="2">Premium</option>
          </select>
        </div>
        <button class="btn-submit" @click="createCompany">Ajouter</button>
      </div>
    </template>
    <template #tab-1>
      <div class="Company-form">
        <div v-if="companies.length === 0">Aucune compagnies pour le moment.</div>
        <div v-else class="Company-grid tab-content-animated">
          <div v-for="company in companies" :key="company.id" class="Company-card">
            <div class="Company-header">
              <h3 class="Company-header-title">{{ company.name }}</h3>
              <div class="Company-actions">
                <button v-if="editingCompanyId !== company.id" @click="startCompanyEdit(company)">
                  ✏️
                </button>
                <button v-if="editingCompanyId === company.id" @click="saveCompanyEdit(company)">
                  💾
                </button>
                <button
                  v-if="editingCompanyId === company.id"
                  class="delete"
                  @click="cancelCompanyEdit"
                >
                  ↩️
                </button>
              </div>
            </div>
            <div v-if="editingCompanyId === company.id" class="form-group">
              <label>Nom de la compagnie</label>
              <input v-model="editedCompanyName" type="text" />
            </div>
            <div v-if="editingCompanyId === company.id" class="form-group">
              <label>Niveau de subscription</label>
              <select v-model="editingCompanySubscription">
                <option value="0">Gratuit</option>
                <option value="1">Basic</option>
                <option value="2">Premium</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AdminTabs>
</template>

<script>
import AdminService from './AdminService';
import AdminTabs from './AdminTabs.vue';

export default {
  name: 'CompaniesManager',
  components: {
    AdminTabs,
  },
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      companyName: '',
      scrumMasterEmail: '',
      scrumMasterName: '',
      scrumMasterTrigramme: '',
      editingCompanyId: null,
      subscriptionLevel: '0',
      editingCompanySubscription: '',
      editedCompanyName: '',
      companies: [],
      tabLabels: [{ label: 'Créer une compagnie' }, { label: 'Liste des compagnies' }],
    };
  },
  mounted() {
    this.fetchCompanies();
  },
  methods: {
    startCompanyEdit(company) {
      this.editingCompanyId = company.id;
      this.editedCompanyName = company.name;
      this.editingCompanySubscription = company.subscriptionLevel;
    },
    cancelCompanyEdit() {
      this.editingCompanyId = null;
      this.editedCompanyName = '';
      this.editingCompanySubscription = '';
    },
    async saveCompanyEdit(company) {
      if (!this.editedCompanyName.trim()) return;

      company.name = this.editedCompanyName.trim();
      company.subscriptionLevel = this.editingCompanySubscription;
      const resultUpdate = await AdminService.updateCompany(
        company.id,
        company.name,
        company.subscriptionLevel
      );
      if (!resultUpdate.isSuccess) {
        this.$root.showToast(resultUpdate.message, 'success');
        return;
      }
      this.$root.showToast('Les informations ont été enregistrées', 'success');
      this.cancelCompanyEdit();
    },
    async fetchCompanies() {
      const resCompanies = await AdminService.getCompanies();
      if (!resCompanies.isSuccess) {
        this.$root.showToast(resCompanies.message, 'error');
        return;
      }
      this.companies = resCompanies.result;
    },
    async createCompany() {
      if (!this.companyName.trim()) return;
      const resultAdd = await AdminService.createCompany(
        this.companyName,
        this.scrumMasterEmail,
        this.scrumMasterName,
        this.scrumMasterTrigramme,
        this.subscriptionLevel
      );
      if (!resultAdd.isSuccess) {
        this.$root.showToast(resultAdd.message, 'success');
        return;
      }

      this.$root.showToast('La compagnie a été créée', 'success');
      this.companyName = '';
      this.scrumMasterEmail = '';
      this.scrumMasterName = '';
      this.scrumMasterTrigramme = '';
      this.subscriptionLevel = '';
      this.fetchCompanies();
    },
    async deleteCompany(companyId) {
      const resutDelete = await AdminService.deleteCompany(companyId);
      if (!resutDelete.isSuccess) {
        this.$root.showToast(resutDelete.message, 'success');
        return;
      }
      this.$root.showToast('La compagnie a été supprimée', 'success');
      this.fetchCompanies();
    },
  },
};
</script>

<style scoped>
.admin-container {
  background-color: #fffaf2;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-width: 800px;
  margin: 0 auto;
}
.form-group {
  display: flex;
  flex-direction: column;
}

.Company-form h2 {
  font-size: 1.6rem;
  color: #333;
  margin-bottom: 1rem;
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
.Company-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.Company-card {
  background-color: white;
  border: 1px solid #ddd;
  border-left: 4px solid #006d77;
  padding: 1rem;
  border-radius: 6px;
}

.Company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.members-title {
  font-weight: bold;
  margin: 0.5rem 0 0.2rem;
}

.form-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  max-width: 800px;
}

.Company-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.Company-card {
  position: relative;
  background-color: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.Company-header-title {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #014d64;
}

.Company-card p {
  margin: 0.2rem 0;
  color: #333;
}

.empty-text {
  font-style: italic;
  color: #777;
}

.Company-actions {
  width: 130px;
  display: flex;
  justify-content: space-around;
}

button.disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
  border: none;
}
</style>
