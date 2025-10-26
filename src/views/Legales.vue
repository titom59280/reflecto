<template>
  <div class="landing-wrapper">
    <header class="header">
      <img src="@/assets/logo.png" alt="Reflecto Logo" class="logo" @click="goToAccueil" />
      <span class="title" @click="goToAccueil">Reflecto</span>
      <button class="start-btn header-button-bis" @click="goToContact">Demander une demo</button>
      <button class="start-btn header-button" @click="goToLandingPageAndConnect()">
        Se connecter
      </button>
    </header>
    <div class="content-landing-page">
      <main class="main-content">
        <div class="intro-section">
          <h1>Mentions Légales</h1>
          <div>
            <h2>Éditeur du site</h2>
            <p>
              Le présent site, <strong>Reflecto</strong>, est édité par :
              <br />
              <strong>Nom de l’entreprise :</strong> Reflecto SAS<br />
              <strong>Adresse :</strong> 123 Rue de l’Innovation, 75000 Paris, France<br />
              <strong>Email :</strong> contact@reflecto.com<br />
              <strong>Téléphone :</strong> +33 1 23 45 67 89<br />
              <strong>SIRET :</strong> 123 456 789 00012
            </p>
          </div>

          <div>
            <h2>Hébergement</h2>
            <p>
              Ce site est hébergé par :<br />
              <strong>Nom de l’hébergeur :</strong> Render.com<br />
              <strong>Adresse :</strong> 456 Avenue du Cloud, 69000 Lyon, France
            </p>
          </div>

          <div>
            <h2>Propriété intellectuelle</h2>
            <p>
              L’ensemble des contenus présents sur ce site (textes, images, logos, illustrations,
              vidéos) sont protégés par les lois en vigueur sur la propriété intellectuelle et
              restent la propriété exclusive de Reflecto, sauf mention contraire. Toute reproduction
              ou utilisation sans autorisation préalable est interdite.
            </p>
          </div>

          <div>
            <h2>Données personnelles</h2>
            <p>
              Les données personnelles collectées via ce site sont utilisées uniquement dans le
              cadre du service Reflecto et ne sont jamais revendues à des tiers. Conformément au
              RGPD, vous pouvez demander la consultation, la modification ou la suppression de vos
              données en nous contactant à l’adresse : <strong>dpo@reflecto.com</strong>.
            </p>
          </div>

          <div>
            <h2>Responsabilité</h2>
            <p>
              Reflecto met tout en œuvre pour assurer l’exactitude et la mise à jour des
              informations diffusées sur ce site. Toutefois, nous ne saurions être tenus
              responsables des éventuelles erreurs ou omissions.
            </p>
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
  methods: {
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
  align-items: center;
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
</style>
