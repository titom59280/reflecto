<template>
  <div class="retro-page">
    <template v-if="noRetroMessage || !retro">
      <!-- Pas de rétro active : admin = action, membre = message d'attente -->
      <div v-if="noRetroMessage === 'board.retroBoard.noActiveSprint'" class="board-empty">
        <template v-if="isScrumMaster && pendingLink">
          <div class="empty-icon pending"><i class="fa-solid fa-play" aria-hidden="true"></i></div>
          <h3>
            {{ $t('board.retroBoard.empty.pendingTitle', { sprint: pendingLink.sprintName }) }}
          </h3>
          <p>
            {{
              $t('board.retroBoard.empty.pendingText', {
                retro: pendingLink.retroName,
                team: pendingLink.teamName,
              })
            }}
          </p>
          <button class="empty-btn" :disabled="activating" @click="activatePendingLink">
            {{ $t('board.retroBoard.empty.activate') }}
          </button>
          <div class="admin-note">
            <i class="fa-solid fa-eye" aria-hidden="true"></i>
            {{ $t('board.retroBoard.empty.adminOnly') }}
          </div>
        </template>
        <template v-else-if="isScrumMaster">
          <div class="empty-icon"><i class="fa-solid fa-calendar-plus" aria-hidden="true"></i></div>
          <h3>{{ $t('board.retroBoard.empty.nothingTitle') }}</h3>
          <p>{{ $t('board.retroBoard.empty.nothingText') }}</p>
          <router-link
            class="empty-btn"
            :to="{ path: '/admin/retros', query: { plan: getTeamId() } }"
          >
            {{ $t('board.retroBoard.empty.plan') }}
          </router-link>
          <div class="admin-note">
            <i class="fa-solid fa-eye" aria-hidden="true"></i>
            {{ $t('board.retroBoard.empty.adminOnly') }}
          </div>
        </template>
        <template v-else>
          <div class="empty-icon waiting">
            <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>
          </div>
          <h3>{{ $t('board.retroBoard.empty.waitingTitle') }}</h3>
          <p>{{ $t('board.retroBoard.empty.waitingText') }}</p>
        </template>
      </div>
      <div v-else class="no-access">
        {{ noRetroMessage ? $t(noRetroMessage) : '' }}
      </div>
    </template>

    <div v-else class="board">
      <!-- Bandeau : rétro, équipe, sprint, phase et actions -->
      <div class="board-bar">
        <div class="board-title">
          <h2>{{ retro.name }}</h2>
          <p>{{ currentLink.teamName }} · {{ currentLink.sprintName }}</p>
        </div>

        <ol class="phases" :aria-label="$t('board.retroBoard.phase.label')">
          <li :class="isCollecting ? 'on' : 'done'">
            <span class="phase-dot">
              <i v-if="!isCollecting" class="fa-solid fa-check" aria-hidden="true"></i>
              <template v-else>1</template>
            </span>
            {{ $t('board.retroBoard.phase.collect') }}
          </li>
          <li :class="{ on: !isCollecting }">
            <span class="phase-dot">2</span>{{ $t('board.retroBoard.phase.discussion') }}
          </li>
          <li><span class="phase-dot">3</span>{{ $t('board.retroBoard.phase.done') }}</li>
        </ol>

        <div class="board-actions">
          <span v-if="isScrumMaster && isCollecting && stats" class="participation">
            {{ $t('board.retroBoard.participationPostits', stats.total) }} ·
            {{
              $t('board.retroBoard.participationMembers', {
                participants: stats.participants,
                team: stats.teamMembers,
              })
            }}
          </span>
          <template v-if="isCollecting">
            <button class="board-btn ghost" type="button" @click="showColorPicker = true">
              <i class="fa-solid fa-palette" aria-hidden="true"></i>
              {{ $t('board.retroBoard.postitColor') }}
            </button>
            <button
              class="board-btn"
              :class="isScrumMaster ? 'secondary' : 'primary'"
              type="button"
              @click="openAddModal"
            >
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              {{ $t('board.retroBoard.addPostit') }}
            </button>
          </template>
          <button
            v-if="isScrumMaster"
            class="board-btn"
            :class="isCollecting ? 'primary' : 'secondary'"
            type="button"
            @click="actionOnRetro"
          >
            {{
              isCollecting
                ? $t('board.retroBoard.action.startDiscussion')
                : $t('board.retroBoard.action.closeSprint')
            }}
          </button>
        </div>
      </div>

      <p class="phase-hint">
        {{
          isCollecting
            ? $t('board.retroBoard.hint.collect')
            : $t('board.retroBoard.hint.discussion')
        }}
      </p>

      <div class="retro-columns">
        <section v-for="cat in categories" :key="cat.id" class="retro-column">
          <header class="column-head">
            <img v-if="cat.image" :src="cat.image" :alt="cat.name" class="category-image" />
            <div class="column-title">
              <h3>{{ cat.name }}</h3>
              <span class="count">{{ categoryCount(cat.name) }}</span>
            </div>
            <p class="description">{{ cat.description }}</p>
          </header>

          <transition-group name="postit" tag="div" class="postit-list">
            <div
              v-for="post in filteredPostIts(cat.name)"
              :key="post.id"
              class="post-it"
              :class="{ clickable: isClickable(post) }"
              :style="{ background: post.color }"
              :title="post.message"
              @click="handlePostitClick(post)"
            >
              <p class="post-text">{{ truncateText(post.message) }}</p>
              <span class="post-footer">
                <i
                  v-if="post.annotation"
                  class="fa-solid fa-comment-dots annotation"
                  :title="$t('board.retroBoard.annotated')"
                ></i>
                <span v-if="post.isAnonymous" class="trigram anonymous-label">
                  <i class="fa-solid fa-user-secret" aria-hidden="true"></i>
                  <!-- Jamais « (vous) » : le tableau est souvent projeté devant toute l'équipe -->
                  {{ $t('board.retroBoard.anonymous') }}
                </span>
                <span v-else class="trigram">{{ post.trigramme }}</span>
              </span>
              <button
                v-if="canDelete(post)"
                class="btn-delete"
                type="button"
                :aria-label="$t('common.delete')"
                @click.stop="confirmDelete(post.id)"
              >
                ✖
              </button>
            </div>
          </transition-group>
          <p v-if="!filteredPostIts(cat.name).length" class="empty-column">
            {{
              isCollecting
                ? $t('board.retroBoard.emptyColumnCollect')
                : $t('board.retroBoard.emptyColumn')
            }}
          </p>
        </section>
      </div>
    </div>
  </div>
  <ColorPickerModal
    :visible="showColorPicker"
    @close="showColorPicker = false"
    @change-color="handleChangeColorPostits"
  />
  <AddPostitModal
    v-if="retro"
    :visible="showModal"
    :categories="categories"
    :initial-postit="selectedPostit"
    @delete="confirmDelete"
    @close="cancelEditOrAddPostIt"
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
    @confirm="startRetro"
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
import AdminService from '@/admin/AdminService';
import AddPostitModal from '@/components/AddPostitModal.vue';
import ReadPostitModal from '@/components/ReadPostitModal.vue';
import StartRetroModeModal from '@/components/StartRetroModeModal.vue';
import CloseSprintModal from '@/components/CloseSprintModal.vue';
import DeletePostitModal from '@/components/DeletePostitModal.vue';
import ColorPickerModal from '@/components/ColorPickerModal.vue';

// Mise à jour automatique du tableau (phase et post-its)
const POLL_INTERVAL_MS = 15000;

export default {
  components: {
    AddPostitModal,
    ReadPostitModal,
    StartRetroModeModal,
    CloseSprintModal,
    DeletePostitModal,
    ColorPickerModal,
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
      currentDisplayedPostit: null,
      user: authService.getUser(),
      isScrumMaster: false,
      currentLink: null,
      // Rétro planifiée mais pas encore activée (visible uniquement par les admins)
      pendingLink: null,
      activating: false,
      loadedTeamId: null,
      showCloseModal: false,
      showColorPicker: false,
      alreadyFetchData: false,
      // Participation pendant la collecte (Scrum Master)
      stats: null,
      pollTimer: null,
      readModalVisible: false,
      selectedPostit: null,
      deleteModalVisible: false,
      nextSprintName: '',
      teams: [],
      retro: null,
      categories: [],
      postits: [],
      // clé i18n (vide = aucun message)
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
    // Collecte : la rétro n'est pas encore lancée (chacun ne voit que ses post-its)
    isCollecting() {
      return !!this.currentLink && !this.currentLink.isRetroInProgress;
    },
  },
  watch: {
    selectedTeamId(newId) {
      if (newId && (newId !== this.loadedTeamId || !this.alreadyFetchData)) {
        this.fetchLinkData();
      }
    },
  },
  mounted() {
    if (!this.alreadyFetchData) {
      this.fetchLinkData();
    }
    // Mise à jour automatique : changement de phase et post-its, sans recharger la page
    this.pollTimer = setInterval(this.refreshBoard, POLL_INTERVAL_MS);
  },
  beforeUnmount() {
    clearInterval(this.pollTimer);
  },
  methods: {
    async handleSprintClosure() {
      this.showCloseModal = false;
      try {
        // getTeamId() et non selectedTeamId (vide quand il n'y a qu'une équipe)
        const resultFinish = await retroService.finishRetro(
          this.currentLink.id,
          this.nextSprintId,
          this.getTeamId()
        );

        if (resultFinish.isSuccess) {
          this.$root.showToast(this.$t('board.retroBoard.toast.sprintFinished'), 'success');
          this.nextSprint = null;
          this.nextSprintId = null;
          this.nextSprintName = '';
          await this.fetchLinkData();
          return;
        }

        this.$root.showToast(this.$apiMessage(resultFinish), 'error');
      } catch (err) {
        this.$root.showToast(this.$t('board.retroBoard.toast.sprintCloseError'), 'error');
      }
    },
    async startRetro() {
      this.startRetroModal = false;
      const resultStart = await retroService.startRetro(this.currentLink.id);

      if (!resultStart.isSuccess) {
        this.$root.showToast(this.$apiMessage(resultStart), 'error');
        return;
      }

      this.currentLink.isRetroInProgress = true;
      this.stats = null;
      await this.fetchPostIts();
    },
    async populateNextSprint() {
      const resultNextSprint = await retroService.getNextSprintName(
        this.currentLink.id,
        this.getTeamId()
      );
      if (!resultNextSprint.isSuccess) {
        this.$root.showToast(this.$apiMessage(resultNextSprint), 'error');
        return;
      }
      const nextSprint = resultNextSprint.result;
      if (nextSprint) {
        this.nextSprint = nextSprint;
        this.nextSprintName = this.nextSprint.name;
        this.nextSprintId = this.nextSprint.id;
      }
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
      this.selectedPostit = null;
      this.readModalVisible = false;
    },
    async actionOnRetro() {
      // Collecte → lancer la discussion ; discussion → clôturer le sprint
      if (this.isCollecting) {
        this.startRetroModal = true;
        return;
      }
      if (!this.nextSprint) {
        await this.populateNextSprint();
      }
      this.showCloseModal = true;
    },
    cancelEditOrAddPostIt() {
      this.selectedPostit = null;
      this.showModal = false;
    },
    async handleDeletePostItConfirmed() {
      const resultDeletePostIt = await retroService.deletePostit(this.deletePostItId);
      if (!resultDeletePostIt.isSuccess) {
        this.$root.showToast(this.$apiMessage(resultDeletePostIt), 'error');
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
      this.selectedPostit = null;
      this.$root.showToast(this.$t('board.retroBoard.toast.postitDeleted'), 'success');
    },
    async confirmDelete(id) {
      this.deletePostItId = id;
      this.deleteModalVisible = true;
    },
    // Suppression : son propre post-it, pendant la collecte (règle identique côté serveur)
    canDelete(post) {
      return this.isCollecting && this.user.id === post.memberId;
    },
    isClickable(post) {
      return (
        (this.isCollecting && post.memberId === this.user.id) ||
        (!this.isCollecting && this.isScrumMaster)
      );
    },
    handlePostitClick(post) {
      const isMine = post.memberId === this.user.id;
      if (isMine && this.isCollecting) {
        this.openEditModal(post);
        return;
      }

      if (this.isScrumMaster && !this.isCollecting) {
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
          this.$root.showToast(this.$apiMessage(resultUpdatePostIt), 'error');
          return;
        }

        this.selectedPostit = null;
        this.fetchPostIts();
      } catch (err) {
        this.$root.showToast(this.$t('board.retroBoard.toast.postitUpdateError'), 'error');
      }
    },
    async handleAnnotation(annotation) {
      try {
        this.selectedPostit.annotation = annotation;
        const resultUpdateAnnotation = await retroService.updatePostit(this.selectedPostit);
        if (!resultUpdateAnnotation.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultUpdateAnnotation), 'error');
        }
        return resultUpdateAnnotation.isSuccess;
      } catch (err) {
        this.$root.showToast(this.$t('board.retroBoard.toast.annotationError'), 'error');
      }
    },
    async handleChangeColorPostits({ color }) {
      try {
        const resultChangeColor = await retroService.chooseColorPostIt(color);
        if (!resultChangeColor.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultChangeColor), 'error');
          return;
        }
        this.$store.dispatch('updateMemberColor', color);
        this.showColorPicker = false;
      } catch (err) {
        this.$root.showToast(this.$t('board.retroBoard.toast.colorChangeError'), 'error');
      }
    },
    async handlePostitCreation({ message, category, isAnonymous }) {
      try {
        if (this.selectedPostit !== null) {
          this.selectedPostit.message = message;
          this.selectedPostit.categoryName = category;
          this.selectedPostit.isAnonymous = isAnonymous;
          this.updatePostit();
          return;
        }

        const newPostit = {
          message,
          categoryName: category,
          sprintRetroTeamLinkId: this.currentLink.id,
          isAnonymous,
        };
        const resultCreatePostIt = await retroService.createPostit(newPostit);
        if (!resultCreatePostIt.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultCreatePostIt), 'error');
          return;
        }
        this.$root.showToast(this.$t('board.retroBoard.toast.postitAdded'), 'success');
        this.fetchPostIts();
      } catch (error) {
        this.$root.showToast(this.$t('board.retroBoard.toast.postitAddError'), 'error');
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
      if (this.user.isScrumMaster && this.$route.query.team) {
        return this.$route.query.team;
      }
      return this.user.teamId;
    },
    async getLinksUser() {
      const teamId = this.getTeamId();
      if (this.isScrumMaster) {
        const resultGetLinksUser = await retroService.getRetroLinksByTeamId(teamId);
        if (!resultGetLinksUser.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultGetLinksUser), 'error');
          return;
        }
        return resultGetLinksUser.result;
      }

      const resultGetUserRetroLinks = await retroService.getUserRetroLinks(this.user.id);
      if (!resultGetUserRetroLinks.isSuccess) {
        this.$root.showToast(this.$apiMessage(resultGetUserRetroLinks), 'error');
        return;
      }
      return resultGetUserRetroLinks.result;
    },
    async activatePendingLink() {
      this.activating = true;
      try {
        const result = await AdminService.activateSprint(this.pendingLink.id);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 5000);
          return;
        }
        this.$root.showToast(this.$t('board.retroBoard.empty.activated'), 'success');
        await this.fetchLinkData();
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      } finally {
        this.activating = false;
      }
    },
    async fetchLinkData() {
      try {
        if (!this.user) {
          this.logout();
          return;
        }
        const teamId = this.getTeamId();
        this.alreadyFetchData = true;
        this.loadedTeamId = teamId;
        this.isScrumMaster = this.user.isScrumMaster;
        this.currentLink = null;
        this.pendingLink = null;
        this.retro = null;
        const links = (await this.getLinksUser()) || [];
        // Une autre équipe a été choisie entre-temps : ce chargement est périmé
        if (teamId !== this.getTeamId()) return;

        this.currentLink = links.find((link) => link.teamId === teamId && link.isActif);
        if (this.isScrumMaster) {
          this.pendingLink = links.find(
            (link) => link.teamId === teamId && !link.isActif && !link.isRetroDone
          );
        }

        if (this.user.isScrumMaster) {
          const resultTeams = await retroService.getTeamsWithMembers();
          if (!resultTeams.isSuccess) {
            this.$root.showToast(this.$apiMessage(resultTeams), 'error');
            return;
          }

          this.teams = resultTeams.result;
        }
        const resultSprints = await retroService.getSprints();
        if (!resultSprints.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultSprints), 'error');
          return;
        }
        this.sprints = resultSprints.result;

        this.noRetroMessage = '';
        if (!this.currentLink) {
          this.noRetroMessage = 'board.retroBoard.noActiveSprint';
          this.alreadyFetchData = false;
          return;
        }

        const resultCategories = await retroService.getCategories(this.currentLink.retroId);

        if (!resultCategories.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultCategories), 'error');
          return;
        }

        this.categories = resultCategories.result;

        const resultRetros = await retroService.getRetros();
        if (!resultRetros.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultRetros), 'error');
          return;
        }

        this.retro = resultRetros.result.find((r) => r.id === this.currentLink.retroId);

        await this.fetchPostIts();
        this.alreadyFetchData = false;
      } catch (err) {
        this.$root.showToast(this.$t('board.retroBoard.toast.fetchError'), 'error');
        this.noRetroMessage = 'board.retroBoard.fetchErrorMessage';
      }
    },
    // Badge des colonnes : en collecte, le Scrum Master voit le total ; les autres leurs post-its
    categoryCount(categoryName) {
      if (this.isScrumMaster && this.isCollecting && this.stats) {
        return this.stats.byCategory.find((c) => c.categoryName === categoryName)?.count || 0;
      }
      return this.filteredPostIts(categoryName).length;
    },
    async fetchStats() {
      if (!this.isScrumMaster || !this.isCollecting) return;
      try {
        const result = await retroService.getPostitStats(this.currentLink.id);
        if (result.isSuccess) this.stats = result.result;
      } catch (err) {
        // Indicatif seulement : pas de message si la participation n'est pas disponible
      }
    },
    // Rafraîchissement silencieux (sans toast) : nouvelle phase, nouveaux post-its
    async refreshBoard() {
      if (!this.currentLink || document.hidden) return;
      try {
        const teamId = this.getTeamId();
        const result = this.isScrumMaster
          ? await retroService.getRetroLinksByTeamId(teamId)
          : await retroService.getUserRetroLinks(this.user.id);
        if (!result.isSuccess || teamId !== this.getTeamId()) return;
        const link = result.result.find((l) => l.teamId === teamId && l.isActif);
        const phaseChanged =
          !link ||
          link.id !== this.currentLink.id ||
          link.isRetroInProgress !== this.currentLink.isRetroInProgress;
        if (phaseChanged) {
          await this.fetchLinkData();
          return;
        }
        await this.fetchPostIts();
      } catch (err) {
        // Nouvel essai au prochain intervalle
      }
    },
    async fetchPostIts() {
      if (!this.currentLink) return;
      // Discussion : tout le monde voit tous les post-its. Collecte : chacun ne voit que les siens.
      if (this.currentLink.isRetroInProgress) {
        const resultPostIts = await retroService.getPostitsByLink(this.currentLink.id);
        if (!resultPostIts.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultPostIts), 'error');
          return;
        }
        this.postits = resultPostIts.result;
        return;
      }

      const resultAll = await retroService.getPostitsByUser(this.currentLink.id);
      if (!resultAll.isSuccess) {
        this.$root.showToast(this.$apiMessage(resultAll), 'error');
        return;
      }
      const all = resultAll.result;
      this.postits = all.filter((p) => p.sprintRetroTeamLinkId === this.currentLink.id);
      await this.fetchStats();
    },
    truncateText(text, maxChars = 140) {
      if (!text) return '';
      return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
    },
    openAddModal() {
      this.selectedPostit = null;
      this.showModal = true;
    },
    filteredPostIts(category) {
      return this.postits.filter((p) => p.categoryName === category);
    },
  },
};
</script>

<style scoped src="@/styles/retro-board.css"></style>

<style scoped>
/* ===== État vide (aucune rétro active) ===== */
.board-empty {
  max-width: 520px;
  margin: 3rem auto;
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-sizing: border-box;
}

.board-empty h3 {
  margin: 0 0 0.5rem;
  color: #003d47;
  font-size: 1.25rem;
}

.board-empty p {
  color: #6b7678;
  margin: 0 0 1.25rem;
  line-height: 1.5;
}

.empty-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: #e6f0f2;
  color: #005a64;
}

.empty-icon.pending {
  background: #faeeda;
  color: #854f0b;
}

.empty-btn {
  display: inline-block;
  background: #005a64;
  color: #ffffff;
  border: 1px solid #005a64;
  border-radius: 8px;
  padding: 0.65rem 1.2rem;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
}

.empty-btn:hover {
  background: #002b36;
}

.empty-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.admin-note {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #6b7678;
  background: #f6f3ea;
  border-radius: 8px;
  padding: 0.6rem;
}

@media (max-width: 480px) {
  .board-empty {
    margin: 1.5rem auto;
    padding: 1.5rem 1rem;
  }

  .empty-btn {
    width: 100%;
  }
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
</style>
