<template>
  <div class="overlay" @click.self="$emit('close')">
    <form class="modal" @submit.prevent="plan">
      <h2>{{ $t('adminRetros.plan.title', { team: team.name }) }}</h2>
      <p v-if="messageError" class="message">{{ messageError }}</p>

      <div class="field">
        <label for="plan-sprint">{{ $t('adminRetros.plan.sprint') }}</label>
        <select v-if="availableSprints.length" id="plan-sprint" v-model="sprintId">
          <option v-for="sprint in availableSprints" :key="sprint.id" :value="sprint.id">
            {{ sprint.name }}
          </option>
        </select>
        <p v-else class="no-sprint">
          {{ $t('adminRetros.plan.noSprint') }}
          <router-link to="/admin/sprints">{{ $t('adminRetros.plan.createSprint') }}</router-link>
        </p>
      </div>

      <div class="field">
        <label for="plan-retro">{{ $t('adminRetros.plan.retro') }}</label>
        <select id="plan-retro" v-model="retroId" @change="onRetroChange">
          <option value="" disabled>{{ $t('adminRetros.plan.chooseRetro') }}</option>
          <optgroup v-if="retros.length" :label="$t('adminRetros.plan.reuse')">
            <option v-for="retro in retros" :key="retro.id" :value="retro.id">
              {{ retro.name }}
            </option>
          </optgroup>
          <option :value="NEW_RETRO">＋ {{ $t('adminRetros.plan.createNew') }}</option>
        </select>
        <small>{{ $t('adminRetros.plan.retroHint') }}</small>
      </div>

      <div class="hint-box">
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        <i18n-t keypath="adminRetros.plan.pendingInfo" tag="span">
          <template #status>
            <b>« {{ $t('adminRetros.teams.status.pending') }} »</b>
          </template>
        </i18n-t>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-sec" @click="$emit('close')">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="btn btn-pri" :disabled="saving">
          {{ $t('adminRetros.plan.submit') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import AdminService from './../AdminService';

const NEW_RETRO = '__new';

export default {
  props: {
    team: { type: Object, required: true },
    sprints: { type: Array, default: () => [] },
    retros: { type: Array, default: () => [] },
    links: { type: Array, default: () => [] },
    // Rétro à présélectionner (par exemple celle qu'on vient de créer)
    selectedRetroId: { type: String, default: '' },
    // Sprint à présélectionner (venant de la page des sprints)
    selectedSprintId: { type: String, default: '' },
  },
  emits: ['close', 'planned', 'create-retro'],
  data() {
    return {
      NEW_RETRO,
      sprintId: '',
      retroId: this.selectedRetroId,
      messageError: '',
      saving: false,
    };
  },
  computed: {
    // Sprints encore ouverts et pas déjà planifiés pour cette équipe, du plus ancien au plus récent
    availableSprints() {
      const usedSprintIds = this.links
        .filter((link) => link.teamId === this.team.id)
        .map((link) => link.sprintId);
      return this.sprints
        .filter((s) => !s.isClosed && !s.isRetroDone && !usedSprintIds.includes(s.id))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
  },
  watch: {
    selectedRetroId(id) {
      this.retroId = id;
    },
  },
  mounted() {
    const preselected = this.availableSprints.find((s) => s.id === this.selectedSprintId);
    this.sprintId = preselected?.id || this.availableSprints[0]?.id || '';
  },
  methods: {
    onRetroChange() {
      if (this.retroId !== NEW_RETRO) return;
      this.retroId = '';
      this.$emit('create-retro');
    },
    async plan() {
      this.messageError = '';
      if (!this.sprintId || !this.retroId) {
        this.messageError = this.$t('adminRetros.associate.missingFields');
        return;
      }
      this.saving = true;
      try {
        const result = await AdminService.createRetroToSprint(
          this.retroId,
          this.sprintId,
          this.team.id
        );
        if (!result.isSuccess) {
          this.messageError = this.$apiMessage(result);
          return;
        }
        const retroName = this.retros.find((r) => r.id === this.retroId)?.name || '';
        const sprintName = this.sprints.find((s) => s.id === this.sprintId)?.name || '';
        this.$root.showToast(
          this.$t('adminRetros.plan.success', { retro: retroName, sprint: sprintName }),
          'success',
          5000
        );
        this.$emit('planned');
      } catch (err) {
        this.messageError = this.$apiMessage(err.response?.data);
      } finally {
        this.saving = false;
      }
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
  padding: 1rem;
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 1.5rem 1.6rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.modal h2 {
  margin: 0 0 1.1rem;
  color: #002b36;
  font-size: 1.3rem;
}

.message {
  background: #fdecea;
  color: #a12622;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  margin: 0 0 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.field label {
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #333;
}

.field select {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  background: #ffffff;
}

.field small {
  color: #6b7678;
  margin-top: 0.35rem;
}

.no-sprint {
  margin: 0;
  color: #6b7678;
}

.no-sprint a {
  color: #005a64;
  font-weight: 600;
}

.hint-box {
  background: #e6f0f2;
  color: #0c447c;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 1px solid #f1ede3;
}

.btn {
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid #005a64;
  cursor: pointer;
  font-family: inherit;
  min-height: 40px;
}

.btn-pri {
  background: #005a64;
  color: #ffffff;
}

.btn-pri:hover {
  background: #002b36;
}

.btn-pri:disabled {
  opacity: 0.7;
  cursor: wait;
}

.btn-sec {
  background: #ffffff;
  color: #005a64;
}

.btn-sec:hover {
  background: #e6f0f2;
}

@media (max-width: 480px) {
  .modal {
    padding: 1.1rem 1rem;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .btn {
    width: 100%;
  }
}
</style>
