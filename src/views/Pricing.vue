<template>
  <div class="landing-wrapper">
    <header class="header">
      <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
      <span class="title" @click="goToAccueil">Reflecto</span>
      <button class="start-btn header-button-bis" @click="goToPricing">Nos offres</button>
      <button class="start-btn header-button-bis" @click="goToContact">Demander une demo</button>
      <button class="start-btn header-button" @click="goToLandingPageAndConnect()">
        Se connecter
      </button>
    </header>
    <div class="content-landing-page">
      <main class="main-content">
        <div class="intro-section">
          <h1>Nos offres</h1>
          <div class="tab-pricing">
            <button
              class="tabPriceLink tabLeft"
              :class="[{ active: isMonth }]"
              @click="changeOffer(true)"
            >
              Mensuel
            </button>
            <button
              class="tabPriceLink tabRight"
              :class="[{ active: !isMonth }]"
              @click="changeOffer(false)"
            >
              Annuel
              <span class="btn-badge" aria-label="discount">2 mois <br />gratuits</span>
            </button>
          </div>
          <div class="offres">
            <div class="card card-1">
              <h2>Gratuit</h2>
              <h3>0€</h3>
              <p>Idéal pour essayer</p>
              <ul>
                <li class="aval">1 équipe</li>
                <li class="aval">3 membres</li>
                <li class="unaval">Image dans les catégories</li>
                <li class="unaval">Support prioritaire</li>
              </ul>
              <div class="btns-link-pricing">
                <button class="start-btn pricing-button" @click="toggleFormCompany">Essayer</button>
              </div>
            </div>
            <div class="card card-2 hot-badge">
              <h2>Standard</h2>
              <h3>{{ getAmount(true) }}</h3>
              <p>Pour les petites structures</p>
              <ul>
                <li class="aval">1 équipe</li>
                <li class="aval">5 membres</li>
                <li class="unaval">Image dans les catégories</li>
                <li class="unaval">Support prioritaire</li>
              </ul>
              <div class="btns-link-pricing">
                <button class="start-btn pricing-button" @click="goToContact">
                  Nous contacter
                </button>
              </div>
            </div>
            <div class="card card-3">
              <h2>Pro</h2>
              <h3>{{ getAmount(false) }}</h3>
              <p>Toute l'application en illimité</p>
              <ul>
                <li class="aval">Multi-équipes</li>
                <li class="aval">Membres illimités</li>
                <li class="aval">Image dans les catégories</li>
                <li class="aval">Support prioritaire</li>
              </ul>
              <div class="btns-link-pricing">
                <button class="start-btn pricing-button" @click="goToContact">
                  Nous contacter
                </button>
              </div>
            </div>
          </div>
          <div class="button">
            <button class="start-btn" @click="goToLandingPageAndConnect()">← Retour</button>
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
.back-button {
  margin-top: 2rem;
  background: white;
  color: #002b36;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
}

.button {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.prices {
  display: flex;
  flex-direction: column;
}

.first {
  font-size: 1rem;
}

.first span {
  font-size: 2rem;
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
}

.logo {
  height: 30px;
}

.main-content {
  display: flex;
  justify-content: center;
  padding: 0rem 2rem;
  flex: 1;
}

.intro-section {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  width: 50%;
}

.intro-section h1 {
  align-self: center;
}

.left {
  flex: 1;
  padding-left: 5rem;
  padding-right: 5rem;
}

.headline {
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: #003b4a;
}

.subtext {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: #444;
}

.right {
  flex: 1;
  text-align: center;
}

.illustration {
  max-width: 100%;
  height: auto;
}

.form-section {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.login-form {
  min-height: 520px;
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

.slide-fade-enter-active {
  transition: all 0.4s ease;
}
.slide-fade-leave-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.screenshots {
  padding: 3rem 2rem;
  text-align: center;
}

.screenshot-grid {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.screenshot-grid img {
  width: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.features {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 250px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.feature-card .icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.pricing-title {
  text-align: center;
  font-size: 1.8rem;
  margin: 2rem 0 1rem;
}

.pricing {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.pricing-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 250px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.pricing-card:hover {
  transform: scale(1.03);
}

.featured {
  border-color: #002b36;
}

.price {
  color: #002b36;
  font-weight: bold;
  font-size: 1.2rem;
}

.landing-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.logo,
.title {
  cursor: pointer;
}

.card {
  display: inline-block;
  position: relative;
  background: #fffcf3;
  color: #283d3b;
  width: 330px;
  height: 450px;
  border-radius: 20px;
  overflow: hidden;
  margin: 0 auto;
  text-align: center;
  box-shadow:
    0 11px 26px 1px #0000004a,
    inset 0 -16px 90px #002b3647;
}
.card h2 {
  margin: 0;
  width: 100%;
  font-size: 30px;
  background: #c44536;
  padding: 20px 0;
  color: #edddd4;
  box-shadow: inset 0px 5px 4px -4px #ecddd461;
}
.card h3 {
  margin: 20px 0;
  font-size: 60px;
  text-shadow: 3px 2px 2px #283d3b38;
}
.card h3 span {
  font-size: 20px;
}
.card p {
  font-style: italic;
  margin: 0 0 30px 0;
}
.card ul {
  text-align: left;
  padding: 0 50px;
  margin: 0;
}
.card ul li {
  display: block;
}
.card ul li:not(:last-child) {
  margin-bottom: 10px;
}
.card ul li.aval::before {
  font-family: 'Font Awesome 5 Free';
  content: '';
  font-weight: 900;
  font-size: 20px;
  color: #197278;
  width: 40px;
  display: inline-block;
}
.card ul li.unaval::before {
  font-family: 'Font Awesome 5 Free';
  content: '';
  font-weight: 900;
  font-size: 20px;
  color: #c44536;
  width: 40px;
  display: inline-block;
}
.card .select {
  cursor: pointer;
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  font-weight: 700;
  background: #3e3e3e;
  color: #efefef;
  font-size: 15px;
  font-family: inherit;
  box-shadow: 0 8px 18px 4px #283d3b4d;
}
.card .select::before {
  content: '';
  font-weight: 900;
  margin-right: 15px;
}
.card-1,
.card-3 {
  position: relative;
  transform: scale(0.9);
}
.card-1 {
  left: 40px;
  margin-left: -60px;
  z-index: 0;
}
.card-1 h2 {
  background: #005f73;
}
.card-2 {
  z-index: 1;
}
.card-3 {
  left: -40px;
  margin-right: -60px;
  z-index: 0;
}
.card-3 h2 {
  background: #781940;
}

.hot-badge::after {
  content: 'POPULAIRE';
  position: absolute;
  background: linear-gradient(to right, #ffd400, #ffbc00);
  padding: 5px 54px;
  box-shadow: 0 0 5px 3px #715e006e;
  top: 25px;
  right: -46px;
  color: #5d4d00;
  font-size: 14px;
  transform: rotateZ(45deg);
}

.offres {
  text-align: center;
}

.pricing-button {
  font-family: 'Segoe UI', sans-serif;
}

.header-button {
  background-color: #02677a;
}

.pricing-button-bis:hover {
  color: white !important;
  border: 1px solid #005a64;
  padding: 12px !important;
  margin-left: 2rem;
}

.pricing-button-bis {
  background-color: white;
  color: #005a64;
  border: 1px solid #005a64;
  padding: 12px !important;
  margin-left: 2rem;
}

.tab-pricing {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  font-family: 'Segoe UI', sans-serif;
}

.btn-badge {
  font-family: 'Segoe UI', sans-serif;
}

.tabPriceLink {
  width: 143px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
  padding: 8px;
}

.tabLeft {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.tabRight {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.tabPriceLink:not(.active) {
  background-color: #fffcf3;
  color: #002b36;
  border: 1px solid #002b36;
}

.active {
  background-color: #002b36;
  color: white;
  border: 1px solid #fffcf3;
}

.saving-price {
  position: absolute;
  top: -20px;
  right: -40px;
  border-radius: 14px;
  font-size: 14px;
  color: #002b36;
  background: #fffcf3;
  padding: 2px 10px;
  z-index: 2;
}

.tabRight {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  padding: 0.75rem 0rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
  overflow: visible;
}

.btn-badge {
  position: absolute;
  top: -24px;
  right: -32px;
  transform: translate(0, 0);
  padding: 0.2rem 0.7rem;
  font-size: 0.9rem;
  line-height: 1.2;
  color: white;
  background: #02677a;
  border-radius: 8px;
  border: 2px solid var(--paper);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  white-space: nowrap;
}

.btns-link-pricing {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

/* Variante compacte (juste un point + chiffre) */
.btn-badge .is-dot {
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 0.7rem;
}
</style>
