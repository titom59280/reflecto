<template>
  <transition name="fade">
    <div v-if="visible" class="modal-overlay">
      <div class="modal-content">
        <div class="post-it-header">
          <h3 class="post-it-header-title">{{ getTextTitle() }}</h3>
          <button class="delete-btn" @click="confirmDelete">🗑️</button>
        </div>
        <label for="message">Message :</label>
        <textarea id="message" v-model="message" placeholder="Décrivez votre point..." />

        <label for="category">Catégorie :</label>
        <select id="category" v-model="selectedCategory">
          <option disabled value="">Choisissez une catégorie</option>
          <option v-for="cat in categories" :key="cat.name" :value="cat.name">
            {{ cat.name }}
          </option>
        </select>

        <div class="modal-actions">
          <button class="btn cancel" @click="close">Annuler</button>
          <button class="btn submit" :disabled="!message || !selectedCategory" @click="submit">
            {{ getTextButtonTitle() }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: Array,
      default: () => [],
    },
    initialPostit: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['close', 'submit', 'delete'],
  data() {
    return {
      id: this.initialPostit?.id || null,
      message: this.initialPostit?.message || '',
      selectedCategory: this.initialPostit?.categoryName || '',
    };
  },
  watch: {
    initialPostit(value) {
      if (!value) {
        this.id = null;
        this.message = '';
        this.selectedCategory = '';
        return;
      }
      this.id = value.id;
      this.message = value.message;
      this.selectedCategory = value.categoryName;
    },
  },
  methods: {
    getTextTitle() {
      if (this.id !== null) {
        return 'Modifier un post-it';
      }

      return 'Ajouter un post-it';
    },
    getTextButtonTitle() {
      if (this.id) {
        return 'Modifier';
      }

      return 'Ajouter';
    },
    confirmDelete() {
      this.$emit('delete', this.id);
    },
    close() {
      this.message = '';
      this.selectedCategory = '';
      this.$emit('close');
    },
    submit() {
      this.$emit('submit', {
        message: this.message,
        category: this.selectedCategory,
      });
      this.close();
    },
  },
};
</script>

<style scoped>
.post-it-header {
  display: flex;
  align-items: baseline;
}
.post-it-header-title {
  flex: 1;
  margin-top: 0;
  font-size: 1.3rem;
  margin-bottom: 0rem;
  color: #333;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #101010;
  background: rgba(10, 10, 10, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background: #fefaf3;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.delete-btn:hover {
  background-color: white;
  color: #dc3545;
  border: 1px solid #dc3545;
}

label {
  display: block;
  margin: 0.5rem 0 0.3rem;
  font-weight: 600;
  color: #555;
}
textarea {
  padding: 0rem;
}

select {
  padding: 0.6rem;
}

textarea,
select {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  margin-bottom: 1rem;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
}

.cancel {
  background-color: #ccc;
  color: #333;
}

.submit {
  background-color: #014d64;
  color: white;
}

.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
