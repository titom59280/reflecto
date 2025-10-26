<template>
  <div class="retro-page">
    <div v-if="retro" class="retro-columns">
      <div v-for="(cat, index) in retro.categories" :key="index" class="retro-column">
        <h3>{{ cat.name }}</h3>
        <img v-if="cat.image" :src="getImagePath(cat.image)" class="category-image" />
        <p class="description">{{ cat.description }}</p>
        <div class="post-it-container">
          <transition-group name="postit" tag="div" class="postit-list">
            <div
              v-for="post in filteredPostIts(cat.name)"
              :key="post.id"
              class="post-it"
              :class="{ hasAnnotation: post.annotation && post.annotation !== '' }"
              @mouseenter="hoveredPostId = post.id"
              @mouseleave="hoveredPostId = null"
              @click="handlePostitClick(post)"
            >
              <p class="post-text">{{ truncateText(post.message) }}</p>
              <span class="trigram">{{ post.trigramme }}</span>
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <div class="add-button-container">
      <button class="add-postit-btn" @click="closeRetroModalVisible = true">Clôturer</button>
    </div>
  </div>
  <ReadPostitModal
    v-if="readModalVisible"
    :visible="readModalVisible"
    :post="selectedPostit"
    :is-retro-retro="true"
    @close="readModalVisible = false"
  />
  <CloseRetroModal
    v-if="closeRetroModalVisible"
    :visible="closeRetroModalVisible"
    @cancel="closeRetroModalVisible = false"
    @confirm="cloturer"
  />
</template>

<script>
import authService from '@/services/authService';
import retroService from '@/services/retroService';
import { API_BASE_URL } from '@/config';
import ReadPostitModal from '@/components/ReadPostitModal.vue';
import AdminService from './AdminService';
import CloseRetroModal from '@/components/CloseRetroModal.vue';

export default {
  components: {
    ReadPostitModal,
    CloseRetroModal,
  },
  props: {
    currentLinkId: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  data() {
    return {
      currentDisplayedPostit: null,
      closeRetroModalVisible: false,
      user: authService.getUser(),
      selectedPostit: null,
      currentLink: null,
      retro: null,
      readModalVisible: false,
      postits: [],
    };
  },
  computed: {
    showTrigram() {
      return this.currentLink?.showTrigram || this.isScrumMaster;
    },
  },
  mounted() {
    this.fetchLinkData();
  },
  methods: {
    handlePostitClick(post) {
      this.openReadModal(post);
    },
    openReadModal(post) {
      this.selectedPostit = post;
      this.readModalVisible = true;
    },
    async cloturer() {
      try {
        await AdminService.closeLinkRetro(this.currentLinkId);
        this.$root.showToast('La rétro a été clôturé avec succès', 'success');
        this.$emit('close');
      } catch (err) {
        this.$root.showToast('Erreur lors de la récupération des données', 'error');
      }
    },
    async fetchLinkData() {
      try {
        const retros = await AdminService.getRetros();
        const links = await AdminService.getSprintRetroLinks();
        console.log(this.currentLinkId);
        console.log(links);
        this.currentLink = links.find((link) => link.id === this.currentLinkId);
        this.retro = retros.find((r) => r.id === this.currentLink.retroId);
        this.fetchPostIts();
      } catch (err) {
        console.log(err);
        this.$root.showToast('Erreur lors de la récupération des données', 'error');
        this.noRetroMessage = 'Erreur de récupération des données.';
      }
    },
    async fetchPostIts() {
      this.postits = await retroService.getPostitsByLink(this.currentLinkId);
    },
    truncateText(text, maxChars = 60) {
      if (!text) return '';
      return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
    },
    getImagePath(filename) {
      if (!this.currentLink) {
        return '';
      }
      return `${API_BASE_URL}/uploads/retros/${this.currentLink.retroId}/${filename}`;
    },
    filteredPostIts(category) {
      return this.postits.filter((p) => p.categoryName === category);
    },
  },
};
</script>

<style scoped>
.start-retro-explain span {
  align-content: center;
}

.retro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.retro-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  height: 100%;
}
.retro-column {
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.post-it {
  background: #fff;
  border: 1px solid #ccc;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border-radius: 8px;
}
.btn-delete {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #dc3545;
  border: none;
  border-radius: 50%;
  color: white;
  width: 20px;
  height: 20px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-delete:hover {
  background-color: white;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.hasAnnotation {
  background-color: #014d64;
  color: white;
}

.post-it:not(.hasAnnotation) {
  background-color: #fff89a;
  color: #333;
}

.no-access {
  color: #c00;
  font-weight: bold;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.retro-board {
  padding: 2rem;
  min-height: 100vh;
}

.columns {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.column {
  border-radius: 12px;
  padding: 1rem;
  width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: background 0.3s ease;
}

.category-image {
  height: 100px;
  margin-bottom: 1rem;
}

.post-it-container {
  background-color: #ebe4d7;
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 95%;
  border-radius: 5%;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #c5c5c5 #f5f5f5;
}

.start-retro-explain {
  display: flex;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #014d64;
  flex: 1;
}

.description {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: #4a3f35; /* marron doux, inspiré maquette */
  line-height: 1.4;
}

.add-button-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1.2rem;
}

.add-postit-btn {
  background-color: #014d64;
  color: white;
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.add-postit-btn:hover {
  background-color: #02677a;
}

.post-it {
  border-radius: 8px;
  margin: 0.5rem 0;
  box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.1);
  width: 105px;
  height: 105px;
  overflow: hidden;
  white-space: normal;
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-height: 1.2;
  font-size: 0.85rem;
  padding: 0.6rem;
  font-family: 'Segoe UI', sans-serif;
  transform: rotate(-1.5deg);
  position: relative;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.post-it::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.fade-postit-enter-active {
  transition: all 0.4s ease;
}
.fade-postit-enter-from {
  transform: scale(0.6) rotate(-10deg);
  opacity: 0;
}
.fade-postit-enter-to {
  transform: rotate(-1.5deg);
  opacity: 1;
}

.retro-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
}

/* transition d'insertion */
.postit-enter-active,
.postit-leave-active {
  transition: all 0.4s ease;
}

.postit-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-8deg);
}

.postit-enter-to {
  opacity: 1;
  transform: scale(1) rotate(-1.5deg);
}

.postit-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

.postit-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  justify-items: center;
  padding: 1rem;
  max-height: 300px;
  scroll-behavior: smooth;
}

/* Webkit (Chrome, Edge, Safari) */
.post-it-container::-webkit-scrollbar {
  width: 8px;
}

.post-it-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 10px;
}

.post-it-container::-webkit-scrollbar-thumb {
  background-color: #b4b4b4;
  border-radius: 10px;
  border: 2px solid #f5f5f5; /* padding via border */
  transition: background 0.3s;
}

.post-it-container::-webkit-scrollbar-thumb:hover {
  background-color: #888;
}

.post-it {
  position: relative;
  width: 105px;
  height: 105px;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.post-text {
  font-size: 0.8rem;
  line-height: 1.1;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trigram {
  font-size: 0.75rem;
  color: #555;
  text-align: right;
  margin-top: 4px;
}
</style>
