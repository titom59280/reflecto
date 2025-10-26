<template>
  <div class="landing-wrapper">
    <header class="header">
      <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
      <span class="title" @click="goToAccueil">Reflecto</span>
      <button class="start-btn header-button-bis" @click="goToContact">Demander une demo</button>
      <button class="start-btn header-button" @click="toggleForm">Se connecter</button>
    </header>
    <div class="content-landing-page">
      <main class="main-content">
        <div class="intro-section">
          <div class="left">
            <h1 class="headline">
              Libérez la puissance de <br />
              vos rétrospectives
            </h1>
            <p class="subtext">
              Faites passer vos rétrospectives au niveau supérieur avec <strong>REFLECTO</strong>,
              l’outil pensé pour les équipes agiles. Renforcez la collaboration, améliorez la
              communication et facilitez la prise de décision pour une dynamique fluide à chaque
              sprint.
            </p>
            <button class="start-btn pricing-button" @click="toggleFormCompany">Commencer</button>
            <button class="start-btn pricing-button-bis" @click="goToContact">
              Demander une demo
            </button>
          </div>
          <div class="right">
            <img src="@/assets/reflecto.png" alt="Retro Illustration" class="illustration" />
          </div>
        </div>
      </main>

      <section class="section-dark">
        <h2 class="pricing-title">POURQUOI REFLECTO ?</h2>
        <div class="explanation">
          <div class="texts">
            <div class="text-explain">
              <p class="big">Dites adieu aux Post-it et au chaos</p>
              Fini les murs recouverts de papiers qui disparaissent après chaque sprint. Avec
              Reflecto, centralisez toutes vos rétrospectives en ligne et ne perdez plus jamais vos
              idées.
            </div>
            <div class="text-explain">
              <p class="big">Simple, flexible et fait pour vous</p>
              Pas besoin de formation ni d’outils complexes. Reflecto s’adapte à votre manière de
              travailler : personnalisez vos catégories, vos sprints et vos équipes facilement.
            </div>
            <div class="text-explain">
              <p class="big">Engagez votre équipe, sans compromis écologique</p>
              Stimulez la participation, gardez une trace dans le temps et dites au revoir au
              gaspillage de papier. Une solution moderne, responsable et accessible à tous..
            </div>
          </div>
        </div>
      </section>

      <section class="screenshots">
        <h2 class="pictures-title">Aperçu de l’application</h2>
        <div class="scroll-gallery">
          <img
            v-for="(img, i) in images"
            :key="i"
            :src="img"
            :alt="`Aperçu ${i + 1}`"
            loading="lazy"
          />
        </div>
      </section>

      <section class="offres">
        <h2 class="pricing-title">NOS OFFRES</h2>
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
        <div class="pricing">
          <div class="pricing-card featured">
            <h3>Découverte</h3>
            <p>Essayer l'application avant de vous lancer</p>
            <span class="price price-text">Gratuit</span>
            <div class="list">
              <span>Jusqu'à 3 utilisateurs</span>
              <span>1 équipe</span>
              <span>1 sprint actif</span>
            </div>
            <div class="btns-link-pricing">
              <button class="start-btn pricing-button" @click="toggleFormCompany">Essayer</button>
            </div>
          </div>
          <div class="pricing-card featured">
            <h3>Standard</h3>
            <p>Pour des petites entreprises</p>
            <div class="prices">
              <span class="price price-text">
                {{ getAmount(true) }}
              </span>
            </div>
            <div class="list">
              <span>Jusqu'à 5 utilisateurs</span>
              <span>1 équipe</span>
              <span>1 sprint actif</span>
            </div>
            <div class="btns-link-pricing">
              <button class="start-btn pricing-button" @click="goToContact">Nous contacter</button>
            </div>
          </div>
          <div class="pricing-card featured">
            <h3>Pro</h3>
            <p>Toute l'application en illimité</p>
            <div class="prices">
              <span class="price price-text">
                {{ getAmount(false) }}
              </span>
            </div>
            <div class="list">
              <span>Utilisateurs illimités</span>
              <span>Multi-équipes</span>
              <span>Support prioritaire</span>
            </div>
            <div class="btns-link-pricing">
              <button class="start-btn pricing-button" @click="goToContact()">
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService';
import screen1 from '@/assets/img/screen1.png';
import screen2 from '@/assets/img/screen2.png';
import screen3 from '@/assets/img/screen3.png';
import screen4 from '@/assets/img/screen4.png';

export default {
  data() {
    return {
      images: [screen1, screen2, screen3, screen4],
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
    goToContact() {
      this.$router.push('/contact');
    },
    goToAccueil() {
      this.$router.push('/');
    },
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

.list {
  display: flex;
  flex-direction: column;
}

.prices {
  display: flex;
  flex-direction: column;
}

.first {
  font-size: 1rem;
}

.pricing-button {
  padding: 12px !important;
}

.price-text {
  font-size: 2rem !important;
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
  align-items: center;
  padding: 0rem 2rem;
  min-height: 500px;
  flex: 1;
}

.offres,
.section-dark {
  background-color: #002b36;
}

.text-explain {
  color: #fffcf3;
}

.intro-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 3rem;
}

.left {
  flex: 1;
  padding-left: 5rem;
  padding-right: 5rem;
}

.headline {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #003b4a;
}

.subtext {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: #444;
}

.start-btn {
  background-color: #002b36;
  color: white;
  padding: 8px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.header-button {
  background-color: #02677a;
}

.start-btn:hover {
  background-color: #02677a;
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
  color: #fdf8e6;
}

.pictures-title {
  text-align: center;
  font-size: 1.8rem;
  margin: 2rem 0 1rem;
  text-transform: uppercase;
  color: #002b36;
}

.pricing {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding-bottom: 2rem;
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

strong {
  color: #002b36;
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

.explanation {
  display: flex;
  padding-left: 10rem;
  padding-right: 10rem;
  padding-bottom: 2rem;
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

.logo,
.title {
  cursor: pointer;
}

h2,
p,
.text-explain {
  cursor: default;
}

.scroll-gallery {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  height: 400px;
  padding-top: 8px;
}
.scroll-gallery img {
  flex: 0 0 40%;
  width: 300px;
  border-radius: 12px;
  scroll-snap-align: start;
  transition: transform 0.3s ease;
}
.scroll-gallery img:hover {
  transform: scale(1.05);
}
</style>
