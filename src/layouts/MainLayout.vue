<template>
  <div class="main-layout">
    <AppHeader @team-changed="handleTeamChanged" />
    <main class="main-content">
      <router-view :selected-team-id="selectedTeamId" />
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader.vue';

export default {
  components: { AppHeader },
  data() {
    return {
      selectedTeamId: '',
    };
  },
  methods: {
    handleTeamChanged(id) {
      this.selectedTeamId = id;
    },
  },
};
</script>

<style scoped>
.main-content {
  padding: 2rem;
  height: 80%;
  overflow: auto;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.main-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
}
</style>
