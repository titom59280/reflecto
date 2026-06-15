<template>
  <transition name="fade">
    <div v-if="visible" class="modal-overlay">
      <div class="modal-content">
        <div class="color-header">
          <h3 class="color-header-title">Couleur de mes post-its</h3>
        </div>
        <label for="message">couleur :</label>
        <div class="swatch-container">
          <div
            v-for="color in colors"
            :key="color"
            :style="{ backgroundColor: color }"
            :class="['swatch', { active: selectedColor === color }]"
            @click="selectColor(color)"
          />
        </div>
        <div class="modal-actions">
          <button class="btn cancel" @click="close">Annuler</button>
          <button class="btn submit" @click="submit">Choisir</button>
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
  },
  emits: ['close', 'change-color'],
  data() {
    return {
      colors: [
        '#FFF89A', // Jaune classique
        '#FFD1DC', // Rose poudré
        '#B5EAD7', // Vert menthe
        '#AEC6CF', // Bleu ciel
        '#FFDAC1', // Pêche
        '#FFF5BA', // Crème dorée
        '#D4F1F4', // Cyan glacé
        '#E8D5B7', // Sable
        '#F9C6D0', // Saumon clair
        '#FADBD8', // Corail pastel
        '#D6EAF8', // Bleu pastel
        '#F9E4B7', // Abricot
        '#E8DAEF', // Mauve clair
        '#D5E8D4', // Vert sauge
      ],
      selectedColor: this.$store.state.memberColor,
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
    selectColor(color) {
      this.selectedColor = color;
    },
    close() {
      this.message = '';
      this.selectedCategory = '';
      this.$emit('close');
    },
    submit() {
      this.$emit('change-color', {
        color: this.selectedColor,
      });
      this.close();
    },
  },
};
</script>

<style scoped>
.color-header {
  display: flex;
  align-items: baseline;
}
.color-header-title {
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

.swatch {
  display: inline-block;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch.active {
  border-color: #014d64;
  transform: scale(1.2);
}

.swatch-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
}
</style>
