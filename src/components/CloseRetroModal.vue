<template>
  <transition name="fade">
    <div v-if="visible" class="overlay">
      <div class="modal">
        <h2>Clôturer la rétro</h2>
        <p>Souhaitez-vous Clôturer cette rétro ?</p>

        <div class="buttons">
          <button class="btn cancel" @click="$emit('cancel')">Annuler</button>
          <button class="btn confirm" @click="confirmClosure">Clôturer</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    visible: Boolean,
  },
  emits: ['cancel', 'confirm'],
  data() {
    return {};
  },
  methods: {
    confirmClosure() {
      this.$emit('confirm');
    },
  },
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
  width: 400px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.modal h2 {
  color: #014d64;
  margin-bottom: 1rem;
}

.modal p {
  font-size: 0.95rem;
  color: #444;
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.6rem;
  margin-top: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  border: none;
}

.confirm {
  background-color: #014d64;
  color: white;
}

.confirm:hover {
  background-color: white;
  color: #014d64;
  border: 1px solid #014d64;
}

.cancel {
  background-color: #aaa;
  color: white;
}

.cancel:hover {
  background-color: white;
  color: #444;
  border: 1px solid #aaa;
}
</style>
