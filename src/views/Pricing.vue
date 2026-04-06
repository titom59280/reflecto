<template>
  <div class="landing-wrapper">
    <header class="header">
      <div class="header-left">
        <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
        <span class="title" @click="goToAccueil">Reflecto</span>
      </div>
      <button class="start-btn header-button-bis" @click="goToContact">
        {{ $t('demanderDemo') }}
      </button>
      <button class="start-btn header-button" @click="goToLandingPageAndConnect()">
        {{ $t('seConnecter') }}
      </button>
    </header>
    <div class="content-landing-page">
      <main class="main-content">
        <div class="intro-section">
          <h1>{{ $t('nosOffres.title') }}</h1>
          <div class="tab-pricing">
            <button
              class="tabPriceLink tabLeft"
              :class="[{ active: isMonth }]"
              @click="changeOffer(true)"
            >
              {{ $t('nosOffres.mensuel') }}
            </button>
            <button
              class="tabPriceLink tabRight"
              :class="[{ active: !isMonth }]"
              @click="changeOffer(false)"
            >
              {{ $t('nosOffres.annuel') }}
              <span class="btn-badge" aria-label="discount">
                2 {{ $t('nosOffres.monthes') }} <br />
                {{ $t('nosOffres.freeLabel') }}
              </span>
            </button>
          </div>
          <div class="offres">
            <div class="card card-1">
              <h2>{{ $t('nosOffres.free') }}</h2>
              <h3>0€</h3>
              <p>{{ $t('nosOffres.ideal') }}</p>
              <ul>
                <li class="aval">1 {{ $t('equipe') }}</li>
                <li class="aval">3 {{ $t('nosOffres.membres') }}</li>
                <li class="unaval">{{ $t('nosOffres.imageCategories') }}</li>
                <li class="unaval">{{ $t('nosOffres.support') }}</li>
              </ul>
              <div class="btns-link-pricing">
                <button class="start-btn pricing-button" @click="toggleFormCompany">
                  {{ $t('nosOffres.essayer') }}
                </button>
              </div>
            </div>
            <div class="card card-2 hot-badge">
              <h2>{{ $t('nosOffres.standard') }}</h2>
              <h3>{{ getAmount(true) }}</h3>
              <p>{{ $t('nosOffres.petitesStructures') }}</p>
              <ul>
                <li class="aval">1 {{ $t('equipe') }}</li>
                <li class="aval">5 {{ $t('nosOffres.membres') }}</li>
                <li class="unaval">{{ $t('nosOffres.imageCategories') }}</li>
                <li class="unaval">{{ $t('nosOffres.support') }}</li>
              </ul>
              <div class="btns-link-pricing">
                <button class="start-btn pricing-button" @click="goToContact">
                  {{ $t('nosOffres.contacter') }}
                </button>
              </div>
            </div>
            <div class="card card-3">
              <h2>{{ $t('nosOffres.pro') }}</h2>
              <h3>{{ getAmount(false) }}</h3>
              <p>{{ $t('nosOffres.illimite') }}</p>
              <ul>
                <li class="aval">{{ $t('nosOffres.multiEquipes') }}</li>
                <li class="aval">{{ $t('nosOffres.membresIllimites') }}</li>
                <li class="aval">{{ $t('nosOffres.imageCategories') }}</li>
                <li class="aval">{{ $t('nosOffres.support') }}</li>
              </ul>
              <div class="btns-link-pricing">
                <button class="start-btn pricing-button" @click="goToContact">
                  {{ $t('nosOffres.contacter') }}
                </button>
              </div>
            </div>
          </div>
          <div class="button">
            <button class="start-btn" @click="goToLandingPageAndConnect()">
              ← {{ $t('retour') }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService';

export default {
  data() {
    return {
      isMonth: true,
      textsPricing: {
        month: {
          standard: '9€',
          pro: '20€',
        },
        annual: {
          standard: '90€',
          pro: '200€',
        },
      },
    };
  },
  methods: {
    toggleFormCompany() {
      this.$store.dispatch('setShowFormCompany', true);
      this.toggleForm();
    },
    toggleForm() {
      if (authService.getUser()) {
        this.$router.push('/retro');
        return;
      }

      this.$router.push('/connection');
      this.$store.dispatch('setShowFormConnection', !this.$store.getters.showFormConnection);
    },
    getAmount(standard) {
      return this.isMonth
        ? standard
          ? this.textsPricing.month.standard
          : this.textsPricing.month.pro
        : standard
          ? this.textsPricing.annual.standard
          : this.textsPricing.annual.pro;
    },
    changeOffer(isMonth) {
      this.isMonth = isMonth;
    },
    goToPricing() {
      this.$router.push('/pricing');
    },
    goToContact() {
      this.$router.push('/contact');
    },
    goToAccueil() {
      this.$store.dispatch('setShowFormConnection', false);
      this.$router.push('/');
    },
    goToLandingPageAndConnect() {
      this.$store.dispatch('setShowFormConnection', true);
      this.redirection();
    },
    redirection() {
      if (authService.getUser()) {
        this.$router.push('/retro');
        return;
      }
      this.$router.push('/');
    },
  },
};
</script>

<style scoped>
/* --- Structure Globale --- */
.landing-wrapper {
  background-color: #fdf8e6;
  font-family: 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  background-color: #002b36;
  color: white;
  padding: 0.7rem 2rem;
  border-bottom: 4px solid #005f73;
}

.logo,
.title {
  cursor: pointer;
}

.header-left {
  padding-left: 8px;
  flex: 1;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.main-content {
  display: flex;
  justify-content: center;
  padding: 2rem;
  flex: 1;
}

.intro-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
}

.intro-section h1 {
  margin-bottom: 2rem;
  font-size: 2.5rem;
  color: #002b36;
}

/* --- Système de Grille des Offres (CORRIGÉ) --- */
.offres {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 1.5rem;
  width: 100%;
  margin-bottom: 3rem;
}

.card {
  display: flex;
  flex-direction: column;
  position: relative;
  background: #fffcf3;
  color: #283d3b;
  width: 100%;
  max-width: 330px;
  min-height: 500px;
  border-radius: 20px;
  overflow: hidden;
  text-align: center;
  box-shadow:
    0 11px 26px 1px rgba(0, 0, 0, 0.2),
    inset 0 -16px 90px rgba(0, 43, 54, 0.1);
  transition: transform 0.3s ease;
}

/* Effet de mise en avant sur Desktop */
@media (min-width: 1024px) {
  .card-1,
  .card-3 {
    transform: scale(0.95);
    align-self: center;
  }
  .card-2 {
    transform: scale(1.05);
    z-index: 2;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  }
}

/* --- Styles Internes des Cartes --- */
.card h2 {
  margin: 0;
  width: 100%;
  font-size: 24px;
  padding: 20px 0;
  color: #edddd4;
  text-transform: uppercase;
}

.card-1 h2 {
  background: #005f73;
}
.card-2 h2 {
  background: #c44536;
}
.card-3 h2 {
  background: #781940;
}

.card h3 {
  margin: 30px 0 10px;
  font-size: 50px;
  text-shadow: 2px 2px 2px rgba(40, 61, 59, 0.2);
}

.card p {
  font-style: italic;
  margin-bottom: 25px;
  color: #666;
}

.card ul {
  text-align: left;
  padding: 0 40px;
  margin-bottom: auto; /* Pousse le bouton vers le bas */
  list-style: none;
}

.card ul li {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.card ul li.aval::before {
  content: '✔';
  color: #197278;
  font-weight: bold;
  margin-right: 15px;
  min-width: 20px;
}

.card ul li.unaval::before {
  content: '✘';
  color: #c44536;
  font-weight: bold;
  margin-right: 15px;
  min-width: 20px;
}

.btns-link-pricing {
  padding: 20px;
  margin-top: auto;
}

.hot-badge::after {
  content: 'POPULAIRE';
  position: absolute;
  background: linear-gradient(to right, #ffd400, #ffbc00);
  padding: 5px 45px;
  top: 22px;
  right: -40px;
  color: #5d4d00;
  font-size: 12px;
  font-weight: bold;
  transform: rotate(45deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.tab-pricing {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
}

.tabPriceLink {
  width: 140px;
  padding: 10px;
  border: 1px solid #002b36;
  cursor: pointer;
  background: white;
  transition: 0.3s;
}

.tabLeft {
  border-radius: 8px 0 0 8px;
}
.tabRight {
  border-radius: 0 8px 8px 0;
  position: relative;
}

.tabPriceLink.active {
  background-color: #002b36;
  color: white;
}

.btn-badge {
  position: absolute;
  top: -25px;
  right: -20px;
  background: #02677a;
  color: white;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1.1;
  white-space: nowrap;
}

.start-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.header-button {
  background-color: #02677a;
  color: white;
  margin-left: 10px;
}
.header-button-bis {
  background-color: transparent;
  color: white;
  margin-left: 10px;
  border: 1px solid white;
}
.pricing-button {
  background-color: #002b36;
  color: white;
  width: 100%;
}

.button {
  margin-top: 2rem;
}
</style>
