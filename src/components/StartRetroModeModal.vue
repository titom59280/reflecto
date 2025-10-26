<template>
  <transition name="fade">
    <div v-if="visible" class="overlay">
      <div class="modal">
        <h2>Démarrer la rétro</h2>

        <p>
          Aucun autre <strong>post-it</strong> ne pourra être ajouté.<br />
          Comment souhaitez-vous afficher les post-its ?
        </p>
        <div class="options">
          <button class="btn" @click="$emit('select', 'all')">Afficher tous</button>
          <button class="btn" @click="$emit('select', 'oneByOne')">Un par un</button>
        </div>
        <button class="cancel" @click="$emit('cancel')">Annuler</button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    visible: Boolean,
  },
  emits: ['select', 'cancel'],
};
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 350px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.8rem;
  background-color: #014d64;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.btn:hover {
  background-color: white;
  color: #014d64;
  border: 1px solid #014d64;
}

.cancel {
  margin-top: 1rem;
  background: none;
  color: #777;
  border: none;
  cursor: pointer;
}
</style>
