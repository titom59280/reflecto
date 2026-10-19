<template>
  <label class="language-selector" :title="$t('common.language')">
    <i class="fa-solid fa-globe" aria-hidden="true"></i>
    <select :value="$i18n.locale" :aria-label="$t('common.language')" @change="changeLocale">
      <option v-for="lang in locales" :key="lang" :value="lang">
        {{ lang.toUpperCase() }}
      </option>
    </select>
  </label>
</template>

<script>
import { SUPPORTED_LOCALES, setLocale } from '@/i18n';

export default {
  data() {
    return {
      locales: SUPPORTED_LOCALES,
    };
  },
  methods: {
    changeLocale(event) {
      setLocale(event.target.value);
    },
  },
};
</script>

<style scoped>
.language-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
}

.language-selector select {
  appearance: none;
  background: transparent;
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: inherit;
  font-weight: 600;
  cursor: pointer;
  min-height: 32px;
}

.language-selector select:hover,
.language-selector select:focus {
  border-color: #ffffff;
  outline: none;
}

.language-selector option {
  color: #002b36;
}
</style>
