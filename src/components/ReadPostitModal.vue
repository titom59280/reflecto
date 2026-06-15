<template>
  <transition name="zoom">
    <div v-if="visible" class="modal-overlay">
      <div class="postit-modal">
        <button v-if="isRetroRetro" class="close" @click="$emit('close')">✖</button>
        <span ref="text" class="text" :style="{ fontSize: fontSize + 'px' }">{{
          post.message
        }}</span>
        <div class="info">
          <span class="category">{{ post.categoryName }}</span>
          <span class="trigram">{{ post.trigramme }}</span>
        </div>
        <div class="annotation-section">
          <label>Annotation :</label>
          <textarea v-model="annotationText" rows="3" />
          <div class="modal-actions">
            <button v-if="!isRetroRetro" class="btn annotate-btn" @click="next">Suivant</button>
          </div>
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
    post: {
      type: Object,
      default: () => {},
    },
    isRetroRetro: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['next', 'annotate', 'close'],
  data() {
    return {
      fontSize: 18, // taille de base
      minFontSize: 12,
      maxFontSize: 100,
      annotationText: this.post?.annotation || '',
    };
  },
  watch: {
    'post.annotation': {
      immediate: true,
      handler() {
        this.annotationText = this.post?.annotation;
      },
    },
    'post.message': {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          this.adjustFontSize();
        });
      },
    },
  },
  methods: {
    adjustFontSize() {
      const textEl = this.$refs.text;
      // const container = textEl.parentElement;

      let size = this.minFontSize;

      while (size <= this.maxFontSize) {
        textEl.style.fontSize = size + 'px';

        // Vérifie si ça dépasse
        if (textEl.scrollHeight > textEl.clientHeight) {
          size--;
          size--;
          break;
        }

        size++;
      }

      // On applique la taille juste avant l'overflow
      this.fontSize = Math.max(size, this.minFontSize);
      textEl.style.fontSize = this.fontSize + 'px';
    },
    next() {
      this.$emit('next', this.annotationText);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 10, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  justify-content: center;
}

.cancel {
  background-color: #ccc;
  color: #333;
}

.btn {
  flex: 0 0 25%;
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
}

.postit-modal {
  width: 50%;
  height: 55%;
  background-color: #fff89a;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: 'Segoe UI', sans-serif;
  transform-origin: center;
  transform: scale(1);
  display: flex;
}
.info {
  display: flex;
  justify-content: space-between;
}
.text {
  font-size: 0.9rem;
  overflow-y: auto;
  line-height: 1.1;
  flex: 1;
}
.category {
  text-align: left;
  font-size: 1rem;
  color: #333;
}
.trigram {
  text-align: right;
  font-size: 1rem;
  color: #333;
}

.close {
  position: absolute;
  top: 6px;
  right: 8px;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.zoom-enter-active {
  animation: zoomIn 0.3s ease-out;
}
.zoom-leave-active {
  animation: zoomOut 0.2s ease-in;
}
@keyframes zoomIn {
  from {
    transform: scale(0.3);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes zoomOut {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.5);
    opacity: 0;
  }
}
.annotation-section {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.annotation-section textarea {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.5rem;
  resize: none;
}

.annotate-btn {
  background-color: #005a64;
  color: white;
  border: 1px solid #005a64;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
}
.annotate-btn:hover {
  background-color: white;
  color: #005a64;
  border: 1px solid #005a64;
}
.zoom-postit-enter-active {
  animation: zoomInPostit 0.3s ease-out;
}
.zoom-postit-leave-active {
  animation: zoomOutPostit 0.2s ease-in;
}

@keyframes zoomInPostit {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes zoomOutPostit {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.4);
    opacity: 0;
  }
}
</style>
