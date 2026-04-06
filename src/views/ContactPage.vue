<template>
  <div class="landing-wrapper">
    <header class="header">
      <div class="header-left">
        <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
        <span class="title" @click="goToAccueil">Reflecto</span>
      </div>
      <button class="start-btn header-button-bis" @click="goToPricing">
        {{ $t('nosOffres.title') }}
      </button>
      <button class="start-btn header-button connection-btn" @click="goToLandingPageAndConnect()">
        {{ $t('seConnecter') }}
      </button>
    </header>
    <div class="main-content">
      <div class="form-section">
        <div class="left-form">
          <h2>{{ $t('contact.titre') }}</h2>
          <p>{{ $t('contact.description1') }}</p>
          <p>
            {{ $t('contact.description2') }}
          </p>
          <p>{{ $t('contact.description3') }}</p>
          <div class="button-action">
            <button class="start-btn" @click="goToLandingPage()">← {{ $t('retour') }}</button>
          </div>
        </div>
        <div class="right-form">
          <div class="container login-form">
            <h2 class="text-center">{{ $t('contact.restonsEnContact') }}</h2>
            <form class="form-login" @submit.prevent="sendContact()">
              <div class="fields">
                <input
                  v-model="honeypot"
                  type="text"
                  style="visibility: hidden"
                  autocomplete="off"
                />
                <div>
                  <label>{{ $t('contact.nom') }} *</label>
                  <input v-model="form.name" type="text" class="input" required />
                </div>
                <div>
                  <label>{{ $t('contact.email') }} *</label>
                  <input v-model="form.email" type="email" class="input" required />
                </div>
                <div>
                  <label>{{ $t('contact.message') }} *</label>
                  <textarea v-model="form.message" class="input" required />
                </div>
              </div>
              <button type="submit" class="button-primary">{{ $t('contact.envoyer') }}</button>
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
      this.$store.dispatch('setShowFormConnection', false);
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
}

.login-form {
  display: flex;
  flex: 1;
  margin: 40px auto;
  flex-direction: column;
  justify-content: space-between;
}

.left-form {
  display: flex;
  width: 50%;
  flex-direction: column;
  flex: 1;
  color: #014d64;
  min-width: 425px;
}

.right-form {
  display: flex;
  width: 50%;
  flex-direction: column;
  flex: 1;
  min-width: 425px;
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

.header-left {
  padding-left: 8px;
  flex: 1;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
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

.form-section {
  display: flex;
  flex-wrap: wrap;
}

.button-action {
  display: flex;
  flex: 1;
  justify-content: center;
}
</style>
