<template>
  <div class="landing-wrapper">
    <header class="header">
      <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
      <span class="title" @click="goToAccueil">Reflecto</span>
      <button class="start-btn header-button-bis" @click="goToPricing">Nos offres</button>
      <button class="start-btn header-button-bis" @click="goToContact">Demander une demo</button>
      <button class="start-btn header-button connection-btn" @click="goToLandingPageAndConnect()">
        Se connecter
      </button>
    </header>
    <div class="main-content">
      <div class="form-section">
        <div class="left-form">
          <h2>Une question ? Une idée ? Nous sommes à l’écoute !</h2>
          <p>Notre équipe se tient prête à vous accompagner dans votre aventure avec Reflecto.</p>
          <p>
            Que ce soit pour une demande d’information, une suggestion d’amélioration, ou une
            partenariat potentiel, nous vous répondrons dans les plus brefs délais.
          </p>
          <p>Ensemble, faisons de vos rétrospectives un moteur de progrès continu !</p>
          <button class="start-btn" @click="goToLandingPage()">← Retour</button>
        </div>
        <div class="right-form">
          <div class="container login-form">
            <h2 class="text-center">Restons en contact</h2>
            <form class="form-login" @submit.prevent="sendContact()">
              <div class="fields">
                <input
                  v-model="honeypot"
                  type="text"
                  style="visibility: hidden"
                  autocomplete="off"
                />
                <div>
                  <label>Nom *</label>
                  <input v-model="form.name" type="text" class="input" required />
                </div>
                <div>
                  <label>Email *</label>
                  <input v-model="form.email" type="email" class="input" required />
                </div>
                <div>
                  <label>Message *</label>
                  <textarea v-model="form.message" class="input" required />
                </div>
              </div>
              <button type="submit" class="button-primary">Envoyer</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService';
import services from '@/services/service';
export default {
  data() {
    return {
      honeypot: '',
      form: { name: '', email: '', message: '' },
    };
  },
  methods: {
    goToContact() {
      this.$router.push('/contact');
    },
    goToPricing() {
      this.$router.push('/pricing');
    },
    goToLandingPageAndConnect() {
      this.$store.dispatch('setShowFormConnection', true);
      this.redirection();
    },
    goToLandingPage() {
      this.redirection();
    },
    goToAccueil() {
      this.$router.push('/');
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

.connection-btn {
  background-color: #02677a;
}

.logo,
.title {
  cursor: pointer;
}
</style>
