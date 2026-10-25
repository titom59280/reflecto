<template>
  <div class="retro-page">
    <div v-if="retro" class="board">
      <!-- Même bandeau que le tableau de rétro : rétro, équipe, sprint, phase et action -->
      <div class="board-bar">
        <div class="board-title">
          <h2>{{ retro.name }}</h2>
          <p>{{ teamName }} · {{ sprintName }}</p>
        </div>

        <ol class="phases" :aria-label="$t('board.retroBoard.phase.label')">
          <li class="done">
            <span class="phase-dot"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
            {{ $t('board.retroBoard.phase.collect') }}
          </li>
          <li class="done">
            <span class="phase-dot"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
            {{ $t('board.retroBoard.phase.discussion') }}
          </li>
          <li class="on">
            <span class="phase-dot">3</span>{{ $t('adminRetros.teams.retroOfRetro') }}
          </li>
        </ol>

        <div class="board-actions">
          <button class="board-btn primary" type="button" @click="closeRetroModalVisible = true">
            {{ $t('admin.retroDeRetro.close') }}
          </button>
        </div>
      </div>

      <p class="phase-hint">{{ $t('admin.retroDeRetro.hint') }}</p>

      <div class="retro-columns">
        <section v-for="cat in categories" :key="cat.id" class="retro-column">
          <header class="column-head">
            <img v-if="cat.image" :src="cat.image" :alt="cat.name" class="category-image" />
            <div class="column-title">
              <h3>{{ cat.name }}</h3>
              <span class="count">{{ filteredPostIts(cat.name).length }}</span>
            </div>
            <p class="description">{{ cat.description }}</p>
          </header>

          <transition-group name="postit" tag="div" class="postit-list">
            <div
              v-for="post in filteredPostIts(cat.name)"
              :key="post.id"
              class="post-it clickable"
              :style="{ background: post.color }"
              :title="post.message"
              @click="openReadModal(post)"
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
                  {{ $t('board.retroBoard.anonymous') }}
                </span>
                <span v-else class="trigram">{{ post.trigramme }}</span>
              </span>
            </div>
          </transition-group>
          <p v-if="!filteredPostIts(cat.name).length" class="empty-column">
            {{ $t('board.retroBoard.emptyColumn') }}
          </p>
        </section>
      </div>
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
      closeRetroModalVisible: false,
      teamName: '',
      sprintName: '',
      user: authService.getUser(),
      selectedPostit: null,
      currentLink: null,
      categories: [],
      retro: null,
      readModalVisible: false,
      postits: [],
    };
  },
  mounted() {
    this.fetchLinkData();
  },
  methods: {
    openReadModal(post) {
      this.selectedPostit = post;
      this.readModalVisible = true;
    },
    async cloturer() {
      try {
        await AdminService.closeLinkRetro(this.currentLinkId);
        this.$root.showToast(this.$t('admin.retroDeRetro.toast.closed'), 'success');
        this.$emit('close');
      } catch (err) {
        this.$root.showToast(this.$t('admin.retroDeRetro.toast.closeError'), 'error');
      }
    },
    async fetchLinkData() {
      try {
        const [resultRetros, resultlinks, resultTeams, resultSprints] = await Promise.all([
          AdminService.getRetros(),
          AdminService.getSprintRetroLinks(),
          AdminService.getTeams(),
          AdminService.getSprints(),
        ]);

        if (!resultlinks.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultlinks), 'error');
          return;
        }

        if (!resultRetros.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultRetros), 'error');
          return;
        }
        this.currentLink = resultlinks.result.find((link) => link.id === this.currentLinkId);
        this.retro = resultRetros.result.find((r) => r.id === this.currentLink.retroId);
        // Équipe et sprint affichés dans le bandeau
        if (resultTeams.isSuccess) {
          this.teamName =
            resultTeams.result.find((t) => t.id === this.currentLink.teamId)?.name || '';
        }
        if (resultSprints.isSuccess) {
          this.sprintName =
            resultSprints.result.find((sp) => sp.id === this.currentLink.sprintId)?.name || '';
        }
        const resultCategories = await AdminService.getCategories(this.currentLink.retroId);

        if (!resultCategories.isSuccess) {
          this.$root.showToast(this.$apiMessage(resultCategories), 'error');
          return;
        }

        this.categories = resultCategories.result;
        this.fetchPostIts();
      } catch (err) {
        this.$root.showToast(this.$t('admin.retroDeRetro.toast.loadError'), 'error');
      }
    },
    async fetchPostIts() {
      const resultPostId = await retroService.getPostitsByLink(this.currentLinkId);
      if (!resultPostId.isSuccess) {
        this.$root.showToast(this.$apiMessage(resultPostId), 'error');
        return;
      }
      this.postits = resultPostId.result;
    },
    truncateText(text, maxChars = 140) {
      if (!text) return '';
      return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
    },
    filteredPostIts(category) {
      return this.postits.filter((p) => p.categoryName === category);
    },
  },
};
</script>

<style scoped src="@/styles/retro-board.css"></style>
