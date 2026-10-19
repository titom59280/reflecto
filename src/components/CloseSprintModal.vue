<template>
  <transition name="fade">
    <div v-if="visible" class="overlay">
      <div class="modal">
        <h2>{{ $t('board.closeSprint.title') }}</h2>
        <p>{{ $t('board.closeSprint.question') }}</p>

        <div v-if="sprintName !== ''">
          <i18n-t keypath="board.closeSprint.nextSprint" tag="p">
            <template #name>
              <strong>{{ sprintName }}</strong>
            </template>
          </i18n-t>
        </div>

        <div v-else>
          <p>
            {{ $t('board.closeSprint.noNextSprint') }}<br />
            {{ $t('board.closeSprint.noNextSprintHint') }}
          </p>
        </div>

        <div class="buttons">
          <button class="btn cancel" @click="$emit('cancel')">{{ $t('common.cancel') }}</button>
          <button class="btn confirm" @click="confirmClosure">
            {{ $t('board.closeSprint.confirm') }}
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
    nextSprintName: {
      type: String,
      default: '',
    },
  },
  emits: ['cancel', 'confirm'],
  data() {
    return {
      sprintName: '',
    };
  },
  watch: {
    nextSprintName(value) {
      this.sprintName = value;
    },
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

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .modal {
    max-height: 90vh;
    max-height: 90dvh;
    overflow-y: auto;
  }

  .buttons {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .btn {
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  .modal {
    box-sizing: border-box;
    width: calc(100vw - 2rem);
    max-width: 400px;
    padding: 1.25rem;
  }

  .modal h2 {
    font-size: 1.25rem;
    margin-top: 0;
  }

  /* Le nom du sprint peut être long */
  .modal p {
    overflow-wrap: anywhere;
  }

  .btn {
    flex: 1 1 auto;
  }
}
</style>
