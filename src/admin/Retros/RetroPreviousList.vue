<template>
  <div>
    <div v-if="closedLinks.length === 0" class="no-access">
      {{ $t('adminRetros.previous.empty') }}
    </div>
    <div v-else class="retros-grid tab-content-animated">
      <div class="retro-list">
        <div v-for="link in closedLinks" :key="link.id" class="retro-card">
          <div class="retro-header">
            <div>
              <h3 class="retro-header-title">{{ link.retroName }}</h3>
              <p class="retro-meta">
                {{ $t('adminRetros.previous.teamLabel') }} <strong>{{ link.teamName }}</strong> |
                {{ $t('adminRetros.previous.sprintLabel') }}
                <strong>{{ link.sprintName }}</strong>
              </p>
            </div>
          </div>
          <div class="retro-actions">
            <button class="view-btn" @click="viewRetro(link)">
              👁️ {{ $t('adminRetros.previous.viewTickets') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour afficher les postits de la rétro complétée -->
    <div v-if="selectedLink && showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedLink.retroName }}</h2>
          <button
            class="close-btn"
            :aria-label="$t('common.close')"
            :title="$t('common.close')"
            @click="closeModal"
          >
            ✕
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-meta">
            {{ $t('adminRetros.previous.teamLabel') }} <strong>{{ selectedLink.teamName }}</strong>
          </p>
          <p class="modal-meta">
            {{ $t('adminRetros.previous.sprintLabel') }}
            <strong>{{ selectedLink.sprintName }}</strong>
          </p>
          <div v-if="selectedRetroPostits.length === 0" class="no-postits">
            {{ $t('adminRetros.previous.noTickets') }}
          </div>
          <div v-else class="postits-container">
            <div v-for="post in selectedRetroPostits" :key="post.id" class="postit-item">
              <p class="postit-message">{{ post.message }}</p>
              <div class="postit-footer">
                <span class="postit-category">{{ post.categoryName }}</span>
                <span class="postit-author">{{
                  post.trigramme || $t('adminRetros.previous.notAvailable')
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
  </div>
</template>

<script>
import retroService from '@/services/retroService';

export default {
  props: {
    retros: { type: Array, default: () => [] },
    sprints: { type: Array, default: () => [] },
    links: { type: Array, default: () => [] },
    teams: { type: Array, default: () => [] },
  },
  emits: ['refresh'],
  data() {
    return {
      selectedLink: null,
      showModal: false,
      selectedRetroPostits: [],
      isLoading: false,
    };
  },
  computed: {
    // Computed (et non data + watch) pour que les libellés de repli suivent le changement de langue
    closedLinks() {
      return this.links
        .filter((link) => link.isRetroDone || link.isClosed)
        .map((link) => ({
          ...link,
          retroName: this.getRetroName(link.retroId),
          teamName: this.getTeamName(link.teamId),
          sprintName: this.getSprintName(link.sprintId),
        }));
    },
  },
  methods: {
    getRetroName(retroId) {
      return (
        this.retros.find((r) => r.id === retroId)?.name ||
        this.$t('adminRetros.previous.unknownRetro')
      );
    },
    getTeamName(teamId) {
      return (
        this.teams.find((t) => t.id === teamId)?.name || this.$t('adminRetros.previous.unknownTeam')
      );
    },
    getSprintName(sprintId) {
      return (
        this.sprints.find((s) => s.id === sprintId)?.name ||
        this.$t('adminRetros.previous.unknownSprint')
      );
    },
    async viewRetro(link) {
      this.selectedLink = link;
      this.isLoading = true;
      try {
        const result = await retroService.getPostitsByLink(link.id);
        if (result.isSuccess) {
          this.selectedRetroPostits = result.result || [];
        } else {
          this.$root.showToast(this.$t('adminRetros.previous.loadError'), 'error');
        }
      } catch (err) {
        console.error(err);
        this.$root.showToast(this.$t('adminRetros.previous.loadError'), 'error');
      } finally {
        this.isLoading = false;
      }
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.selectedLink = null;
      this.selectedRetroPostits = [];
    },
  },
};
</script>

<style scoped>
.retro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.retro-list {
  padding: 1rem;
  background: #fff;
}

.retro-card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-left: 4px solid #0087ac;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.retro-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.retro-header-title {
  margin: 0 0 0.5rem 0;
  color: #014d64;
  font-size: 1.1rem;
}

.retro-meta {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.retro-actions {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  padding: 0.6rem 1rem;
  background-color: #005a64;
  color: white;
  border: 1px solid #005a64;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.view-btn:hover {
  background-color: white;
  color: #005a64;
  border: 1px solid #005a64;
}

.no-access {
  color: #c00;
  font-weight: bold;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.modal-header h2 {
  margin: 0;
  color: #014d64;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1rem 0;
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
  border-radius: 4px;
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

.tab-content-animated {
  animation: fadeIn 0.3s ease-in forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .retro-list {
    padding: 0.75rem 0;
  }

  .retro-card {
    padding: 0.75rem;
  }

  .retro-header-title,
  .retro-meta {
    overflow-wrap: anywhere;
  }

  .view-btn {
    min-height: 40px;
  }

  /* Modale : jamais plus large que l'écran, défilement interne */
  .modal-content {
    padding: 1rem;
    width: 95%;
    max-width: calc(100vw - 2rem);
    max-height: 90vh;
  }

  .modal-header {
    gap: 0.5rem;
  }

  .modal-header h2 {
    font-size: 1.2rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .close-btn {
    flex-shrink: 0;
    min-width: 40px;
    min-height: 40px;
  }

  .modal-body {
    padding: 0.5rem 0;
  }

  .postit-item {
    padding: 0.75rem;
  }

  .postit-footer {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .no-postits {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .retro-actions {
    flex-direction: column;
  }

  .view-btn {
    width: 100%;
  }

  .modal-overlay {
    align-items: flex-end;
  }

  .modal-content {
    width: 100%;
    max-width: 100%;
    max-height: 90vh;
    border-radius: 12px 12px 0 0;
  }
}
</style>
