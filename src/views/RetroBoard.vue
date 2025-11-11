<template>
  <div class="retro-page">
    <div v-if="noRetroMessage || !retro" class="no-access">{{ noRetroMessage }}</div>

    <div v-else class="retro-columns">
      <div v-for="cat in categories" :key="cat.id" class="retro-column">
        <h3>{{ cat.name }}</h3>
        <img v-if="cat.image" :src="getImagePath(cat.image)" class="category-image" />
        <p class="description">{{ cat.description }}</p>
        <div v-if="messageToDisplay === ''" class="post-it-container">
          <transition-group name="postit" tag="div" class="postit-list">
            <div
              v-for="post in filteredPostIts(cat.name)"
              :key="post.id"
              class="post-it"
              @mouseenter="hoveredPostId = post.id"
              @mouseleave="hoveredPostId = null"
              @click="handlePostitClick(post)"
            >
              <p class="post-text">{{ truncateText(post.message) }}</p>
              <span class="trigram">{{ post.trigramme }}</span>
              <button
                v-if="hoveredPostId === post.id && canDelete(post)"
                class="btn-delete"
                @click.stop="confirmDelete(post.id)"
              >
                ✖
              </button>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
    <div v-if="messageToDisplay !== ''" class="start-retro-explain">
      <span>{{ messageToDisplay }}</span>
    </div>
    <div v-if="retro && !noRetroMessage" class="add-button-container">
      <button
        v-if="currentLink && !currentLink.isRetroInProgress && !initializedRetro"
        class="add-postit-btn"
        @click="openAddModal"
      >
        Ajouter
      </button>
      <button v-if="isScrumMaster" class="add-postit-btn" @click="actionOnRetro">
        {{ getActionOnRetroButtonLabel() }}
      </button>
    </div>
  </div>
  <AddPostitModal
    v-if="retro"
    :visible="showModal"
    :categories="categories"
    :initial-postit="selectedPostit"
    @delete="confirmDelete"
    @close="showModal = false"
    @submit="handlePostitCreation"
  />

  <ReadPostitModal
    v-if="readModalVisible"
    :visible="readModalVisible"
    :post="selectedPostit"
    :is-retro-retro="false"
    @close="readModalVisible = false"
    @next="showNextPostit"
  />
  <StartRetroModeModal
    :visible="startRetroModal"
    @select="handleRetroMode"
    @cancel="startRetroModal = false"
  />
  <CloseSprintModal
    v-if="currentLink"
    :visible="showCloseModal"
    :current-sprint-id="currentLink.sprintId"
    :next-sprint-name="nextSprintName"
    @cancel="showCloseModal = false"
    @confirm="handleSprintClosure"
  />

  <DeletePostitModal
    v-if="deleteModalVisible"
    :visible="deleteModalVisible"
    @cancel="deleteModalVisible = false"
    @confirm="handleDeletePostItConfirmed"
  />
</template>

<script>
import retroService from '@/services/retroService';
import authService from '@/services/authService';
import { API_BASE_URL } from '@/config';
import AddPostitModal from '@/components/AddPostitModal.vue';
import ReadPostitModal from '@/components/ReadPostitModal.vue';
import StartRetroModeModal from '@/components/StartRetroModeModal.vue';
import CloseSprintModal from '@/components/CloseSprintModal.vue';
import DeletePostitModal from '@/components/DeletePostitModal.vue';

export default {
  components: {
    AddPostitModal,
    ReadPostitModal,
    StartRetroModeModal,
    CloseSprintModal,
    DeletePostitModal,
  },
  props: {
    selectedTeamId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      startRetroModal: false,
      oneByOneMode: false,
      remainingPostits: [],
      currentDisplayedPostit: null,
      user: authService.getUser(),
      isScrumMaster: false,
      currentLink: null,
      showCloseModal: false,
      initializedRetro: false,
      alreadyFetchData: false,
      hoveredPostId: null,
      readModalVisible: false,
      selectedPostit: null,
      deleteModalVisible: false,
      messageToDisplay: '',
      nextSprintName: '',
      teams: [],
      retro: null,
      categories: [],
      postits: [],
      postitsToShow: [],
      noRetroMessage: '',
      sprints: [],
      links: [],
      showModal: false,
      nextSprintId: null,
      deletePostItId: null,
    };
  },
  computed: {
    showTrigram() {
      return this.currentLink?.showTrigram || this.isScrumMaster;
    },
    canAddPostits() {
      return this.currentLink && !this.currentLink.isRetroDone;
    },
  },
  watch: {
    selectedTeamId(newId) {
      if (newId && !this.alreadyFetchData) {
        this.fetchLinkData();
      }
    },
  },
  mounted() {
    if (!this.alreadyFetchData) {
      this.fetchLinkData();
    }
  },
  methods: {
    async handleSprintClosure() {
      this.showCloseModal = false;
      try {
        const resultFinish = await retroService.finishRetro(
          this.currentLink.id,
          this.nextSprintId,
          this.selectedTeamId
        );

        if (resultFinish.isSuccess) {
          this.$root.showToast('Sprint terminé avec succès', 'success');
          window.location.reload();
          return;
        }

        this.$root.showToast(resultFinish.message, 'error');
      } catch (err) {
        this.$root.showToast('Erreur lors de la clôture du sprint', 'error');
      }
    },
    async handleRetroMode(mode) {
      this.startRetroModal = false;
      this.messageToDisplay = '';
      this.currentLink.isRetroInProgress = true;
      const resultStart = await retroService.startRetro(this.currentLink.id);

      if (!resultStart.isSuccess) {
        this.$root.showToast(resultStart.message, 'error');
        return;
      }

      await this.fetchPostIts();
      if (mode === 'all') {
        this.showAllPostits = true;
        return;
      }
      this.postitsToShow = [...this.postits];
      this.postits = [];
      this.oneByOneMode = true;
      this.remainingPostits = [...this.postitsToShow].sort(() => Math.random() - 0.5);
      await this.showNextPostit('');
    },
    async populateNextSprint() {
      const resultNextSprint = await retroService.getNextSprintName(
        this.currentLink.id,
        this.selectedTeamId
      );
      if (!resultNextSprint.isSuccess) {
        this.$root.showToast(resultNextSprint.message, 'error');
        return;
      }
      const nextSprint = resultNextSprint.result;
      if (nextSprint) {
        this.nextSprint = nextSprint;
        this.nextSprintName = this.nextSprint.name;
        this.nextSprintId = this.nextSprint.id;
      }
    },
    async initializeRetro() {
      this.populateNextSprint();
      this.messageToDisplay =
        'La rétro est prête cliquer sur "Démarrer" quand tous les participants sont préts.';
      this.initializedRetro = true;
      this.postits = [];
    },
    async showNextPostit(annotation) {
      if (
        this.selectedPostit !== undefined &&
        this.selectedPostit !== null &&
        annotation !== this.selectedPostit.annotation
      ) {
        if (!(await this.handleAnnotation(annotation))) {
          return;
        }
      }
      if (this.remainingPostits.length === 0) {
        this.oneByOneMode = false;
        this.selectedPostit = null;
        this.readModalVisible = false;
        this.showCloseModal = true;
        return;
      }
      this.selectedPostit = this.remainingPostits.pop();
      this.postits.push(this.selectedPostit);
      this.readModalVisible = true;
    },
    async actionOnRetro() {
      let currentStateRetroForAction = this.getCurrentStateRetro();

      switch (currentStateRetroForAction) {
        case 1:
          this.initializeRetro();
          break;
        case 2:
          this.startRetroModal = true;
          break;
        case 3:
          if (!this.nextSprint) {
            await this.populateNextSprint();
          }
          this.showCloseModal = true;
          break;
        default:
          this.$root.showToast('Action non prévue', 'error');
          break;
      }
    },
    getCurrentStateRetro() {
      if (!this.currentLink) {
        return -1;
      }
      if (this.currentLink.isRetroDone) {
        return 4;
      }

      if (this.currentLink.isRetroInProgress) {
        return 3;
      }

      if (!this.currentLink.isRetroInProgress && this.initializedRetro) {
        return 2;
      }

      return 1;
    },
    getActionOnRetroButtonLabel() {
      let currentState = this.getCurrentStateRetro();
      switch (currentState) {
        case 3:
          return 'Terminer';
        case 2:
          return 'Démarrer';
        default:
          return 'Initialiser';
      }
    },
    async handleDeletePostItConfirmed() {
      const resultDeletePostIt = await retroService.deletePostit(this.deletePostItId);
      if (!resultDeletePostIt.isSuccess) {
        this.$root.showToast(resultDeletePostIt.message, 'error');
        return;
      }

      this.fetchPostIts();
      if (this.showModal) {
        this.showModal = false;
      }
      if (this.deleteModalVisible) {
        this.deleteModalVisible = false;
      }
      this.deletePostItId = null;
      this.$root.showToast('Post-it supprimé', 'success');
    },
    async confirmDelete(id) {
      this.deletePostItId = id;
      this.deleteModalVisible = true;
    },
    canDelete(post) {
      return this.user.id === post.memberId;
    },
    handlePostitClick(post) {
      const isMine = post.memberId === this.user.id;
      const isMaster = this.user.isScrumMaster;
      const isRetroStarted = this.currentLink.isRetroInProgress;
      if (isMine && !isRetroStarted) {
        this.openEditModal(post);
        return;
      }

      if (isMaster && isRetroStarted) {
        this.openReadModal(post);
      }
    },
    openEditModal(post) {
      this.selectedPostit = post;
      this.showModal = true;
    },
    openReadModal(post) {
      this.selectedPostit = post;
      this.readModalVisible = true;
    },
    async updatePostit() {
      try {
        const resultUpdatePostIt = await retroService.updatePostit(this.selectedPostit);

        if (!resultUpdatePostIt.isSuccess) {
          this.$root.showToast(resultUpdatePostIt.message, 'error');
          return;
        }

        this.selectedPostit = null;
        this.fetchPostIts();
      } catch (err) {
        this.$root.showToast('Erreur lors de la modification du post-it', 'error');
      }
    },
    async handleAnnotation(annotation) {
      try {
        this.selectedPostit.annotation = annotation;
        const resultUpdateAnnotation = await retroService.updatePostit(this.selectedPostit);
        if (!resultUpdateAnnotation.isSuccess) {
          this.$root.showToast(resultUpdateAnnotation.message, 'error');
        }
        return resultUpdateAnnotation.isSuccess;
      } catch (err) {
        this.$root.showToast("Erreur lors de l'ajout de l'annotation", 'error');
      }
    },
    async handlePostitCreation({ message, category }) {
      try {
        if (this.selectedPostit !== null) {
          this.selectedPostit.message = message;
          this.selectedPostit.categoryName = category;
          this.updatePostit();
          return;
        }

        const newPostit = {
          message,
          categoryName: category,
          sprintRetroTeamLinkId: this.currentLink.id,
        };
        const resultCreatePostIt = await retroService.createPostit(newPostit);
        if (!resultCreatePostIt.isSuccess) {
          this.$root.showToast(resultCreatePostIt.message, 'error');
          return;
        }
        this.$root.showToast('Post-it ajouté', 'success');
        this.fetchPostIts();
      } catch (error) {
        this.$root.showToast("Erreur lors de l'ajout du post-it", 'error');
      }
    },
    logout() {
      authService.logout();
      this.$router.push('/');
      return;
    },
    getTeamId() {
      if (!this.user) {
        this.logout();
        return;
      }
      if (
        this.selectedTeamId !== null &&
        this.selectedTeamId !== '' &&
        this.selectedTeamId !== undefined
      ) {
        return this.selectedTeamId;
      }
      return this.user.teamId;
    },
    async getLinksUser() {
      const teamId = this.getTeamId();
      if (this.isScrumMaster) {
        const resultGetLinksUser = await retroService.getRetroLinksByTeamId(teamId);
        if (!resultGetLinksUser.isSuccess) {
          this.$root.showToast(resultGetLinksUser.message, 'error');
          return;
        }
        return resultGetLinksUser.result;
      }

      const resultGetUserRetroLinks = await retroService.getUserRetroLinks(this.user.id);
      if (!resultGetUserRetroLinks.isSuccess) {
        this.$root.showToast(resultGetUserRetroLinks.message, 'error');
        return;
      }
      return resultGetUserRetroLinks.result;
    },
    async fetchLinkData() {
      try {
        if (!this.user) {
          this.logout();
          return;
        }
        const teamId = this.getTeamId();
        this.alreadyFetchData = true;
        this.isScrumMaster = this.user.isScrumMaster;
        const links = await this.getLinksUser();

        if (links.length > 0) {
          this.currentLink = links.find((link) => link.teamId === teamId && link.isActif);
        }

        if (this.user.isScrumMaster) {
          const resultTeams = await retroService.getTeamsWithMembers();
          if (!resultTeams.isSuccess) {
            this.$root.showToast(resultTeams.message, 'error');
            return;
          }

          this.teams = resultTeams.result;
        }
        const resultSprints = await retroService.getSprints();
        if (!resultSprints.isSuccess) {
          this.$root.showToast(resultSprints.message, 'error');
          return;
        }
        this.sprints = resultSprints.result;

        this.noRetroMessage = '';
        if (!this.currentLink) {
          this.noRetroMessage = "L'équipe n'a pas encore de sprint en cours.";
          return;
        }

        const resultCategories = await retroService.getCategories(this.currentLink.retroId);

        if (!resultCategories.isSuccess) {
          this.$root.showToast(resultCategories.message, 'error');
          return;
        }

        this.categories = resultCategories.result;

        const resultRetros = await retroService.getRetros();
        if (!resultRetros.isSuccess) {
          this.$root.showToast(resultRetros.message, 'error');
          return;
        }

        this.retro = resultRetros.result.find((r) => r.id === this.currentLink.retroId);

        await this.fetchPostIts();
        this.alreadyFetchData = false;
      } catch (err) {
        this.$root.showToast('Erreur lors de la récupération des données', 'error');
        this.noRetroMessage = 'Erreur de récupération des données.';
      }
    },
    async fetchPostIts() {
      if (!this.currentLink) return;
      if (this.isScrumMaster && this.currentLink.isRetroInProgress) {
        const resultPostIts = await retroService.getPostitsByLink(this.currentLink.id);
        if (!resultPostIts.isSuccess) {
          this.$root.showToast(resultPostIts.message, 'error');
          return;
        }
        this.postits = resultPostIts.result;
        return;
      }

      const resultAll = await retroService.getPostitsByUser(this.currentLink.id);
      if (!resultAll.isSuccess) {
        this.$root.showToast(resultAll.message, 'error');
        return;
      }
      const all = resultAll.result;
      this.postits = all.filter((p) => p.sprintRetroTeamLinkId === this.currentLink.id);
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
    openAddModal() {
      // Tu pourras afficher une modale ou une interface pour créer un post-it
      this.showModal = true;
    },
    filteredPostIts(category) {
      return this.postits.filter((p) => p.categoryName === category);
    },
  },
};
</script>

<style scoped>
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
  background: #fff89a;
  color: #333;
  margin: 0.5rem 0;
  white-space: normal;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-height: 1.2;
  font-size: 0.85rem;
  transform: rotate(-1.5deg);
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
  background: #000;
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
  max-height: 350px;
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
  background-color: #fff89a;
  border-radius: 6px;
  box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #fff89a;
  color: #333;
  margin: 0.5rem 0;
  white-space: normal;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-height: 1.2;
  font-size: 0.85rem;
  transform: rotate(-1.5deg);
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
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
