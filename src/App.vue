<template>
  <div
    id="app"
    class="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white text-landing-page"
  >
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-left">
          <img src="@/assets/logo.png" alt="Reflecto" class="logo" />
          <p class="footer-p">© {{ getYear() }} Reflecto. {{ $t('tousDroitsReserves') }}.</p>
        </div>
        <div class="footer-links">
          <LanguageSelector />
          <span @click="navigate('Landing')">{{ $t('accueil') }}</span>
          <span @click="navigate('Contact')">{{ $t('contact.button') }}</span>
          <span @click="navigate('Legales')">{{ $t('legales.titre') }}</span>
        </div>
      </div>
    </footer>
  </div>
  <transition name="fade">
    <div v-if="toast.message" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </transition>
</template>

<script>
import LanguageSelector from '@/components/LanguageSelector.vue';

export default {
  name: 'App',
  components: { LanguageSelector },
  data() {
    return {
      toast: {
        message: '',
        type: '', // 'success' | 'error'
      },
    };
  },
  methods: {
    getYear() {
      return new Date().getFullYear();
    },
    navigate(value) {
      this.$router.push({ name: value });
    },
    showToast(message, type = 'success', duration = 3000) {
      this.toast.message = message;
      this.toast.type = type;
      setTimeout(() => {
        this.toast.message = '';
        this.toast.type = '';
      }, duration);
    },
  },
};
</script>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #fefbf4;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.test:not(.login-form):not(.set-up):not(.landing-wrapper) {
  height: 100%;
}

.text-landing-page {
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.content-landing-page {
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.text-white {
  height: 100%;
}

.success {
  background-color: #4caf50; /* vert */
}

.error {
  background-color: #f44336; /* rouge */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-p {
  padding: unset;
  margin: 8px;
}

.footer .logo {
  height: 15px;
}

.footer {
  background: #002b36;
  color: white;
  border-top: 4px solid #005f73;
}
.footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem 1.5rem;
  max-width: 1200px;
  margin: auto;
  padding: 0.25rem 1.5rem;
}
.footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1rem;
}
.footer-links span {
  color: white;
  text-decoration: none;
  transition: color 0.3s;
  cursor: pointer;
  white-space: nowrap;
}
.footer-links span:hover {
  color: #94d2bd;
}

@media (max-width: 600px) {
  .footer-container {
    flex-direction: column-reverse;
    padding: 0.75rem 1rem;
    text-align: center;
  }
  .footer-links {
    justify-content: center;
  }
  .footer-p {
    margin: 4px 8px;
    font-size: 0.85rem;
  }
  .toast {
    width: max-content;
    max-width: calc(100vw - 2rem);
    box-sizing: border-box;
    text-align: center;
  }
}
.logo {
  height: 30px;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.4s ease;
  display: block;
  min-height: 100vh; /* Empêche le saut de page */
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(10px); /* Tu peux mettre 0px si tu veux juste un fade */
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px); /* Légère remontée */
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px); /* Légère descente */
}

/* Évite tout "saut" vertical lors du changement de page */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
