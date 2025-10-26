<template>
  <div class="landing-wrapper">
    <header class="header">
      <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
      <span class="title" @click="goToAccueil">Reflecto</span>
      <button class="start-btn header-button-bis" @click="goToContact">Demander une demo</button>
    </header>
    <div class="main-content">
      <div class="form-section">
        <div class="left-form">
          <h2>Rejoignez l’aventure Reflecto</h2>
          <p>
            Simplifiez vos rétrospectives agiles, engagez vos équipes, et transformez chaque sprint
            en opportunité d'amélioration continue. 🚀
          </p>
          <p>
            Créez un compte gratuitement dès maintenant ou connectez-vous si vous avez déjà accès à
            un espace Reflecto.
          </p>
          <p>
            Une fois que vous serez convaincue par notre outils, contactez nous pour en faire
            profiter toute votre équipe.
          </p>
          <button class="start-btn" @click="goToLandingPage()">← Retour</button>
        </div>
        <div class="right-form">
          <AuthForm />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService';
import services from '@/services/service';
import AuthForm from './AuthForm.vue';

export default {
  components: { AuthForm },
  data() {
    return {
      honeypot: '',
      form: { name: '', email: '', message: '' },
    };
  },
  methods: {
    goToLandingPageAndConnect() {
      this.$store.dispatch('setShowFormConnection', true);
      this.redirection();
    },
    goToAccueil() {
      this.$router.push('/');
    },
    goToLandingPage() {
      this.redirection();
    },
    redirection() {
      if (authService.getUser()) {
        this.$router.push('/retro');
        return;
      }
      this.$router.push('/');
    },
    async sendContact() {
      const res = await services.sendContact(this.form.name, this.form.email, this.form.message);
      if (!res.isSuccess) {
        this.$root.showToast(res.message, 'error');
        return;
      }
      this.$root.showToast(res.message, 'success');
    },
  },
};
</script>

<style scoped>
.fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-login {
  flex: 1;
  flex-direction: column;
  display: flex;
}

.form-section {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.login-form {
  display: flex;
  flex: 1;
  margin: 40px auto;
  flex-direction: column;
  justify-content: space-between;
}

.left-form {
  flex: 1;
  color: #014d64;
}

.right-form {
  flex: 1;
}

.contact-page-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.main-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0rem 2rem;
  min-height: 500px;
  flex: 1;
}

.title {
  padding-left: 8px;
  flex: 1;
  font-weight: 700;
  font-size: 1.5rem;
}

.header {
  display: flex;
  align-items: center;
  background-color: #002b36;
  color: white;
  padding: 0.7rem 2rem;
  border-bottom: 4px solid #005f73;
}

.landing-wrapper {
  background-color: #fdf8e6;
  font-family: 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

.logo,
.title {
  cursor: pointer;
}
</style>
