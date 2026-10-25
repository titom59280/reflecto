<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ retroName }}</h2>
        <button
          class="close-btn"
          :aria-label="$t('common.close')"
          :title="$t('common.close')"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-meta">
          {{ $t('adminRetros.previous.teamLabel') }} <strong>{{ teamName }}</strong> |
          {{ $t('adminRetros.previous.sprintLabel') }} <strong>{{ sprintName }}</strong>
        </p>
        <p v-if="loading" class="no-postits">{{ $t('common.loading') }}</p>
        <div v-else-if="postits.length === 0" class="no-postits">
          {{ $t('adminRetros.previous.noTickets') }}
        </div>
        <div v-else class="postits-container">
          <div v-for="post in postits" :key="post.id" class="postit-item">
            <p class="postit-message">{{ post.message }}</p>
            <div class="postit-footer">
              <span class="postit-category">{{ post.categoryName }}</span>
              <span class="postit-author">{{
                post.isAnonymous
                  ? $t('board.retroBoard.anonymous')
                  : post.trigramme || $t('adminRetros.previous.notAvailable')
              }}</span>
            </div>
            <div v-if="post.annotation" class="postit-annotation">
              <strong>{{ $t('adminRetros.previous.noteLabel') }}</strong> {{ post.annotation }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import retroService from '@/services/retroService';

export default {
  props: {
    link: { type: Object, required: true },
    retroName: { type: String, default: '' },
    teamName: { type: String, default: '' },
    sprintName: { type: String, default: '' },
  },
  emits: ['close'],
  data() {
    return {
      postits: [],
      loading: true,
    };
  },
  async mounted() {
    try {
      const result = await retroService.getPostitsByLink(this.link.id);
      if (!result.isSuccess) {
        this.$root.showToast(this.$t('adminRetros.previous.loadError'), 'error');
        return;
      }
      this.postits = result.result || [];
    } catch (err) {
      this.$root.showToast(this.$t('adminRetros.previous.loadError'), 'error');
    } finally {
      this.loading = false;
    }
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.modal-header h2 {
  margin: 0;
  color: #014d64;
  overflow-wrap: anywhere;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  min-width: 40px;
  min-height: 40px;
  flex-shrink: 0;
}

.close-btn:hover {
  color: #333;
}

.modal-meta {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.no-postits {
  color: #999;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.postits-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.postit-item {
  background: #fffbf0;
  border: 1px solid #e0d5c7;
  border-left: 4px solid #0087ac;
  padding: 1rem;
  border-radius: 0;
}

.postit-message {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.95rem;
  word-break: break-word;
}

.postit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #999;
}

.postit-category {
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-weight: 600;
}

.postit-author {
  font-weight: 600;
  color: #666;
}

.postit-annotation {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0d5c7;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

@media (max-width: 480px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal-content {
    padding: 1rem;
    max-height: 90vh;
    border-radius: 12px 12px 0 0;
  }
}
</style>
