<template>
  <transition name="fade">
    <div v-if="visible" class="overlay">
      <div class="modal">
        <h2>{{ $t('board.startRetro.title') }}</h2>

        <p>
          <i18n-t keypath="board.startRetro.noMorePostits" tag="span">
            <template #postit>
              <strong>{{ $t('board.startRetro.postit') }}</strong>
            </template>
          </i18n-t>
          <br />
          {{ $t('board.startRetro.question') }}
        </p>
        <div class="options">
          <button class="btn" @click="$emit('confirm')">
            {{ $t('board.startRetro.confirm') }}
          </button>
        </div>
        <button class="cancel" @click="$emit('cancel')">{{ $t('common.cancel') }}</button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    visible: Boolean,
  },
  emits: ['confirm', 'cancel'],
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

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .modal {
    max-height: 90vh;
    max-height: 90dvh;
    overflow-y: auto;
  }

  .btn {
    min-height: 44px;
  }

  .cancel {
    min-height: 44px;
    padding: 0 1rem;
  }
}

@media (max-width: 480px) {
  /* Largeur fixe de 350px + padding : débordait sous ~415px */
  .modal {
    box-sizing: border-box;
    width: calc(100vw - 2rem);
    max-width: 350px;
    padding: 1.25rem;
  }

  .modal h2 {
    font-size: 1.25rem;
    margin-top: 0;
  }
}
</style>
