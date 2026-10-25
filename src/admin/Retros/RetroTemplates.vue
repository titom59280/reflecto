<template>
  <div class="templates-root">
    <div class="templates-toolbar">
      <button
        v-if="archivedRetros.length"
        type="button"
        class="btn btn-ghost"
        @click="showArchived = !showArchived"
      >
        <i class="fa-solid fa-box-archive" aria-hidden="true"></i>
        {{
          showArchived
            ? $t('adminRetros.templates.hideArchived')
            : $t('adminRetros.templates.showArchived', { count: archivedRetros.length })
        }}
      </button>
      <button type="button" class="btn btn-pri" @click="$emit('create')">
        <i class="fa-solid fa-plus" aria-hidden="true"></i> {{ $t('adminRetros.templates.create') }}
      </button>
    </div>

    <div class="templates-scroll">
      <p v-if="activeRetros.length === 0" class="empty-page">
        {{ $t('adminRetros.templates.empty') }}
      </p>

      <div class="templates">
        <div v-for="retro in activeRetros" :key="retro.id" class="tpl">
          <h3>{{ retro.name || $t('adminRetros.list.untitled') }}</h3>
          <div class="meta">{{ $t('adminRetros.templates.uses', usesCount(retro.id)) }}</div>
          <div class="tpl-actions">
            <button type="button" class="btn btn-sec" @click="$emit('edit', retro)">
              {{ $t('adminRetros.list.edit') }}
            </button>
            <!-- Déjà utilisée : on archive (l'historique la référence), sinon suppression -->
            <button
              v-if="usesCount(retro.id) > 0"
              type="button"
              class="btn btn-sec"
              :title="$t('adminRetros.templates.archiveHint')"
              @click="setArchived(retro, true)"
            >
              {{ $t('adminRetros.templates.archive') }}
            </button>
            <button v-else type="button" class="btn btn-danger" @click="deleteRetro(retro)">
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>

      <template v-if="showArchived && archivedRetros.length">
        <h3 class="archived-title">{{ $t('adminRetros.templates.archivedTitle') }}</h3>
        <p class="archived-hint">{{ $t('adminRetros.templates.archivedHint') }}</p>
        <div class="templates">
          <div v-for="retro in archivedRetros" :key="retro.id" class="tpl archived">
            <span class="archived-badge">{{ $t('adminRetros.templates.archivedBadge') }}</span>
            <h3>{{ retro.name || $t('adminRetros.list.untitled') }}</h3>
            <div class="meta">{{ $t('adminRetros.templates.uses', usesCount(retro.id)) }}</div>
            <div class="tpl-actions">
              <button type="button" class="btn btn-sec" @click="setArchived(retro, false)">
                {{ $t('adminRetros.templates.unarchive') }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import AdminService from './../AdminService';

export default {
  props: {
    retros: { type: Array, default: () => [] },
    links: { type: Array, default: () => [] },
  },
  emits: ['refresh', 'create', 'edit'],
  data() {
    return {
      showArchived: false,
    };
  },
  computed: {
    activeRetros() {
      return this.retros.filter((retro) => !retro.isArchived);
    },
    archivedRetros() {
      return this.retros.filter((retro) => retro.isArchived);
    },
  },
  methods: {
    usesCount(retroId) {
      return this.links.filter((link) => link.retroId === retroId).length;
    },
    isInUse(retro) {
      return this.links.some(
        (link) => link.retroId === retro.id && !link.isRetroDone && !link.isClosed
      );
    },
    async setArchived(retro, archived) {
      // Une rétro planifiée ou active doit d'abord être retirée de l'équipe
      if (archived && this.isInUse(retro)) {
        this.$root.showToast(this.$t('adminRetros.templates.inUse'), 'error', 5000);
        return;
      }
      try {
        const result = await AdminService.setRetroArchived(retro.id, archived);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error');
          return;
        }
        this.$root.showToast(
          this.$t(
            archived ? 'adminRetros.templates.archived' : 'adminRetros.templates.unarchived',
            { name: retro.name }
          ),
          'success'
        );
        this.$emit('refresh');
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
    async deleteRetro(retro) {
      if (this.isInUse(retro)) {
        this.$root.showToast(this.$t('adminRetros.templates.inUse'), 'error', 5000);
        return;
      }
      try {
        const result = await AdminService.deleteRetro(retro.id);
        if (!result.isSuccess) {
          this.$root.showToast(this.$apiMessage(result), 'error', 5000);
          return;
        }
        this.$root.showToast(this.$t('adminRetros.list.deleted'), 'success');
        this.$emit('refresh');
      } catch (err) {
        this.$root.showToast(this.$apiMessage(err.response?.data), 'error');
      }
    },
  },
};
</script>

<style scoped>
.templates-root {
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.templates-toolbar {
  flex: none;
}

.templates-scroll {
  min-height: 0;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .templates-root {
    display: block;
  }

  .templates-scroll {
    overflow-y: visible;
  }
}

.templates-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.empty-page {
  color: #6b7678;
  text-align: center;
}

.templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 1rem;
}

.tpl {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  padding: 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
}

.tpl h3 {
  margin: 0 0 0.25rem;
  color: #003d47;
  font-size: 1.1rem;
  overflow-wrap: anywhere;
}

.meta {
  color: #6b7678;
  font-size: 0.88rem;
  margin-bottom: 0.9rem;
}

.tpl-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.btn {
  border-radius: 8px;
  padding: 0.5rem 0.95rem;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  border: 1px solid #005a64;
  cursor: pointer;
  font-family: inherit;
  min-height: 38px;
  transition: background 0.2s ease;
}

.btn-pri {
  background: #005a64;
  color: #ffffff;
}

.btn-pri:hover {
  background: #002b36;
}

.btn-sec {
  background: #ffffff;
  color: #005a64;
}

.btn-sec:hover {
  background: #e6f0f2;
}

.btn-ghost {
  background: transparent;
  color: #5b6669;
  border-color: #d6d1c4;
}

.btn-ghost:hover {
  background: #f1ede3;
}

.archived-title {
  margin: 2rem 0 0.25rem;
  color: #5b6669;
  font-size: 1.05rem;
}

.archived-hint {
  margin: 0 0 1rem;
  color: #6b7678;
  font-size: 0.9rem;
}

.tpl.archived {
  background: #f8f6f0;
  border-style: dashed;
}

.tpl.archived h3 {
  color: #5b6669;
}

.archived-badge {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  color: #444441;
  background: #e7e4da;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  margin-bottom: 0.5rem;
}

.btn-danger {
  background: #ffffff;
  color: #a32d2d;
  border-color: #a32d2d;
}

.btn-danger:hover {
  background: #fcebeb;
}

@media (max-width: 480px) {
  .templates-toolbar .btn,
  .tpl-actions .btn {
    flex: 1 1 auto;
    width: 100%;
  }
}
</style>
