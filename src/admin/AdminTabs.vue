<!-- components/AdminTabs.vue -->
<template>
  <div class="form-switch">
    <div class="switch-button">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        :class="['tab-button', { active: activeTab === index }]"
        @click="activeTab = index"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="switch-content">
      <slot :name="`tab-${activeTab}`"></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    tabs: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      activeTab: 0,
    };
  },
};
</script>

<style scoped>
.form-switch {
  overflow: auto;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.switch-button {
  display: flex;
  justify-content: space-around;
  border-bottom: 1px solid #ddd;
  background-color: #f7f7f7;
}

.tab-button {
  flex: 1;
  padding: 12px;
  font-weight: 600;
  font-size: 1.4rem;
  text-align: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.switch-content {
  padding: 20px;
}
</style>
