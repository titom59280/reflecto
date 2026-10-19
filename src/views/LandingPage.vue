<template>
  <div class="landing-wrapper">
    <header class="header">
      <div class="header-left">
        <img
          src="@/assets/logo.png"
          :alt="$t('landingPage.logoAlt')"
          class="logo"
          @click="goToAccueil"
        />
        <span class="title" @click="goToAccueil">Reflecto</span>
      </div>
      <button class="start-btn header-button-bis" @click="goToPricing">
        {{ $t('nosOffres.title') }}
      </button>
      <button class="start-btn header-button-bis" @click="goToContact">
        {{ $t('demanderDemo') }}
      </button>
      <button class="start-btn header-button" @click="toggleForm">
        {{ $t('seConnecter') }}
      </button>
    </header>

    <div class="content-landing-page">
      <!-- ===== Hero ===== -->
      <section class="hero">
        <div class="hero-text">
          <span class="badge">{{ $t('landingPage.hero.badge') }}</span>
          <h1 class="headline">{{ $t('landingPage.hero.title') }}</h1>
          <p class="subtext">{{ $t('landingPage.hero.subtitle') }}</p>
          <div class="cta-row">
            <button class="cta cta-primary" @click="toggleFormCompany">
              {{ $t('landingPage.hero.ctaPrimary') }}
            </button>
            <button class="cta cta-secondary" @click="goToContact">
              {{ $t('demanderDemo') }}
            </button>
          </div>
          <p class="reassurance">{{ $t('landingPage.hero.reassurance') }}</p>
        </div>

        <!-- Aperçu du tableau en HTML : net sur tous les écrans et traduit -->
        <div class="board-preview" aria-hidden="true">
          <div class="window-dots"><span></span><span></span><span></span></div>
          <div class="board-columns">
            <div v-for="column in demoBoard" :key="column.title" class="board-column">
              <p class="board-column-title">{{ column.title }}</p>
              <div
                v-for="(note, i) in column.notes"
                :key="note"
                class="demo-note"
                :style="{ background: column.color, '--tilt': i % 2 ? '1.5deg' : '-1.5deg' }"
              >
                <span>{{ note }}</span>
                <span class="demo-trigram">{{ column.trigrams[i] }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Pourquoi Reflecto ===== -->
      <section class="section">
        <h2 class="section-title">{{ $t('landingPage.why.title') }}</h2>
        <p class="section-subtitle">{{ $t('landingPage.why.subtitle') }}</p>
        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.key" class="feature-card">
            <span class="feature-icon" :class="feature.color">
              <i :class="feature.icon" aria-hidden="true"></i>
            </span>
            <h3>{{ $t(`landingPage.why.${feature.key}.title`) }}</h3>
            <p>{{ $t(`landingPage.why.${feature.key}.text`) }}</p>
          </article>
        </div>
      </section>

      <!-- ===== Comment ça fonctionne ===== -->
      <section class="section section-white">
        <h2 class="section-title">{{ $t('landingPage.steps.title') }}</h2>
        <ol class="steps">
          <li v-for="n in 3" :key="n" class="step">
            <span class="step-number">{{ n }}</span>
            <h3>{{ $t(`landingPage.steps.step${n}.title`) }}</h3>
            <p>{{ $t(`landingPage.steps.step${n}.text`) }}</p>
          </li>
        </ol>
      </section>

      <!-- ===== Focus : historique / rétro de rétro ===== -->
      <section class="section showcase">
        <div class="history-preview" aria-hidden="true">
          <div v-for="item in demoHistory" :key="item.sprint" class="history-row">
            <span class="history-sprint">{{ item.sprint }}</span>
            <span class="history-name">{{ item.name }}</span>
            <span class="history-status"><i class="fa-solid fa-check"></i></span>
          </div>
        </div>
        <div class="showcase-text">
          <span class="badge">{{ $t('landingPage.showcase.badge') }}</span>
          <h2>{{ $t('landingPage.showcase.title') }}</h2>
          <p>{{ $t('landingPage.showcase.text') }}</p>
          <ul class="checklist">
            <li v-for="n in 3" :key="n">
              <i class="fa-solid fa-check" aria-hidden="true"></i>
              {{ $t(`landingPage.showcase.point${n}`) }}
            </li>
          </ul>
        </div>
      </section>

      <!-- ===== Offres ===== -->
      <section class="section pricing-teaser">
        <div>
          <h2>{{ $t('landingPage.pricingTeaser.title') }}</h2>
          <p>{{ $t('landingPage.pricingTeaser.text', { price: startingPrice }) }}</p>
        </div>
        <button class="cta cta-secondary" @click="goToPricing">
          {{ $t('landingPage.pricingTeaser.cta') }}
        </button>
      </section>

      <!-- ===== Appel à l'action final ===== -->
      <section class="final-cta">
        <h2>{{ $t('landingPage.finalCta.title') }}</h2>
        <p>{{ $t('landingPage.finalCta.text') }}</p>
        <button class="cta cta-light" @click="toggleFormCompany">
          {{ $t('landingPage.finalCta.cta') }}
        </button>
      </section>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService';

export default {
  data() {
    return {
      startingPrice: '9€',
      features: [
        { key: 'custom', icon: 'fa-solid fa-palette', color: 'amber' },
        { key: 'facilitation', icon: 'fa-solid fa-person-chalkboard', color: 'purple' },
        { key: 'memory', icon: 'fa-solid fa-clock-rotate-left', color: 'teal' },
      ],
    };
  },
  computed: {
    // Contenu de démonstration traduit, recalculé au changement de langue
    demoBoard() {
      const t = (key) => this.$t(`landingPage.demo.${key}`);
      return [
        {
          title: t('col1'),
          color: '#c0dd97',
          notes: [t('note1'), t('note2')],
          trigrams: ['ALB', 'MRO'],
        },
        {
          title: t('col2'),
          color: '#fac775',
          notes: [t('note3'), t('note4')],
          trigrams: ['JDU', 'ALB'],
        },
        {
          title: t('col3'),
          color: '#b5d4f4',
          notes: [t('note5')],
          trigrams: ['MRO'],
        },
      ];
    },
    demoHistory() {
      return [12, 11, 10].map((n, i) => ({
        sprint: `Sprint ${n}`,
        name: this.$t(`landingPage.demo.retro${i + 1}`),
      }));
    },
  },
  mounted() {
    if (this.$store.getters.showFormConnection) {
      this.$router.push('/connection');
    }
  },
  methods: {
    goToContact() {
      this.$router.push('/contact');
    },
    goToPricing() {
      this.$router.push('/pricing');
    },
    goToAccueil() {
      this.$store.dispatch('setShowFormConnection', false);
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
/* ===== Header (inchangé) ===== */
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

.logo {
  height: 30px;
}

.logo,
.title {
  cursor: pointer;
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

/* ===== Page ===== */
.landing-wrapper {
  background-color: #fdf8e6;
  font-family: 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  color: #1f2a2c;
}

.section {
  padding: 4.5rem 2rem;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.section-white {
  max-width: none;
  background: #ffffff;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #002b36;
  margin: 0 0 0.75rem;
}

.section-subtitle {
  text-align: center;
  color: #5b6669;
  font-size: 1.05rem;
  max-width: 620px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
}

.badge {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #085041;
  background: #e1f5ee;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
}

/* ===== Boutons ===== */
.cta {
  border-radius: 10px;
  padding: 0.85rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.cta:hover {
  transform: translateY(-2px);
}

.cta-primary {
  background: #002b36;
  color: #ffffff;
  border: 1px solid #002b36;
  box-shadow: 0 6px 16px rgba(0, 43, 54, 0.2);
}

.cta-primary:hover {
  background: #02677a;
  border-color: #02677a;
}

.cta-secondary {
  background: transparent;
  color: #002b36;
  border: 1px solid #002b36;
}

.cta-secondary:hover {
  background: #002b36;
  color: #ffffff;
}

.cta-light {
  background: #ffffff;
  color: #002b36;
  border: 1px solid #ffffff;
}

.cta-light:hover {
  background: #e1f5ee;
}

/* ===== Hero ===== */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  align-items: center;
  gap: 3rem;
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 5rem 2rem 4rem;
  box-sizing: border-box;
  animation: fadeUp 0.6s ease-out both;
}

.headline {
  font-size: clamp(2.2rem, 4.2vw, 3.4rem);
  line-height: 1.12;
  color: #002b36;
  margin: 1rem 0;
  letter-spacing: -0.02em;
}

.subtext {
  font-size: 1.15rem;
  line-height: 1.6;
  color: #4a5558;
  margin: 0 0 1.75rem;
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.reassurance {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  color: #6b7678;
}

/* Aperçu du tableau */
.board-preview {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 24px 50px rgba(0, 43, 54, 0.14);
  animation: fadeUp 0.7s 0.15s ease-out both;
}

.window-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 0.9rem;
}

.window-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e24b4a;
}
.window-dots span:nth-child(2) {
  background: #ef9f27;
}
.window-dots span:nth-child(3) {
  background: #639922;
}

.board-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.board-column {
  background: #fdf8e6;
  border-radius: 10px;
  padding: 0.7rem;
  min-height: 210px;
}

.board-column-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #002b36;
  margin: 0 0 0.6rem;
}

.demo-note {
  position: relative;
  border-radius: 4px;
  padding: 0.6rem 0.6rem 1.5rem;
  margin-bottom: 0.6rem;
  font-size: 0.82rem;
  line-height: 1.35;
  color: #2c2c2a;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transform: rotate(var(--tilt));
  transition: transform 0.25s ease;
}

.board-preview:hover .demo-note {
  transform: rotate(0deg);
}

.demo-trigram {
  position: absolute;
  right: 0.5rem;
  bottom: 0.3rem;
  font-size: 0.7rem;
  color: #5f5e5a;
}

/* ===== Atouts ===== */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

.feature-card {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  padding: 1.75rem;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 43, 54, 0.08);
}

.feature-card h3 {
  font-size: 1.15rem;
  color: #002b36;
  margin: 1rem 0 0.5rem;
}

.feature-card p {
  color: #5b6669;
  line-height: 1.6;
  margin: 0;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}
.feature-icon.amber {
  background: #faeeda;
  color: #854f0b;
}
.feature-icon.purple {
  background: #eeedfe;
  color: #534ab7;
}
.feature-icon.teal {
  background: #e1f5ee;
  color: #0f6e56;
}

/* ===== Étapes ===== */
.steps {
  list-style: none;
  padding: 0;
  margin: 2.5rem auto 0;
  max-width: 960px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
  counter-reset: none;
  position: relative;
}

/* Ligne reliant les étapes */
.steps::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 16%;
  right: 16%;
  border-top: 2px dashed #b4cfd3;
}

.step {
  position: relative;
  text-align: center;
}

.step-number {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #002b36;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 0 0 6px #ffffff;
}

.step h3 {
  color: #002b36;
  font-size: 1.15rem;
  margin: 1rem 0 0.4rem;
}

.step p {
  color: #5b6669;
  line-height: 1.55;
  margin: 0;
}

/* ===== Focus historique ===== */
.showcase {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.5rem;
  align-items: center;
}

.history-preview {
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  padding: 0.75rem;
  box-shadow: 0 18px 40px rgba(0, 43, 54, 0.1);
}

.history-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 0.75rem;
  border-bottom: 1px solid #f1ede3;
}

.history-row:last-child {
  border-bottom: none;
}

.history-sprint {
  font-size: 0.8rem;
  font-weight: 700;
  color: #02677a;
  background: #e6f0f2;
  border-radius: 6px;
  padding: 0.25rem 0.55rem;
  white-space: nowrap;
}

.history-name {
  flex: 1;
  font-weight: 600;
  color: #002b36;
}

.history-status {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eaf3de;
  color: #3b6d11;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.showcase-text h2 {
  font-size: 1.8rem;
  color: #002b36;
  margin: 1rem 0 0.75rem;
  line-height: 1.2;
}

.showcase-text p {
  color: #5b6669;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.checklist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}

.checklist li {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  color: #2f3b3e;
}

.checklist i {
  color: #0f6e56;
}

/* ===== Offres ===== */
.pricing-teaser {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  background: #ffffff;
  border: 1px solid #ece7da;
  border-radius: 16px;
  padding: 2rem 2.25rem;
  margin-bottom: 4.5rem;
  max-width: 1056px;
}

.pricing-teaser h2 {
  font-size: 1.4rem;
  color: #002b36;
  margin: 0 0 0.4rem;
}

.pricing-teaser p {
  color: #5b6669;
  margin: 0;
}

/* ===== Appel à l'action final ===== */
.final-cta {
  background: #002b36;
  color: #ffffff;
  text-align: center;
  padding: 4rem 2rem;
}

.final-cta h2 {
  font-size: 2rem;
  margin: 0 0 0.6rem;
}

.final-cta p {
  color: #b8cfd2;
  margin: 0 0 1.75rem;
  font-size: 1.05rem;
}

h2,
p,
h3 {
  cursor: default;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero,
  .board-preview {
    animation: none;
  }
  .cta,
  .demo-note,
  .feature-card {
    transition: none;
  }
}

/* ===== Responsive ===== */
@media (max-width: 960px) {
  .hero,
  .showcase {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .hero {
    padding-top: 3rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    max-width: 560px;
    margin: 0 auto;
  }

  /* L'aperçu historique passe sous le texte */
  .history-preview {
    order: 2;
  }
}

@media (max-width: 768px) {
  /* Header : comportement existant conservé */
  .header {
    flex-wrap: wrap;
    row-gap: 0.5rem;
    padding: 0.7rem 1rem;
  }

  .header .start-btn {
    margin-right: 0.75rem;
    min-height: 40px;
  }

  .header .start-btn:last-child {
    margin-right: 0;
  }

  .section {
    padding: 3rem 1rem;
  }

  .hero {
    padding: 2rem 1rem 2.5rem;
  }

  .section-title {
    font-size: 1.6rem;
  }

  .steps {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .steps::before {
    display: none;
  }

  .pricing-teaser {
    flex-direction: column;
    align-items: flex-start;
    margin: 0 1rem 3rem;
    width: auto;
    padding: 1.5rem;
  }

  .final-cta {
    padding: 3rem 1rem;
  }

  .final-cta h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  /* Header : logo sur une ligne, boutons répartis sur la ligne suivante */
  .header {
    column-gap: 0.5rem;
  }

  .header-left {
    flex: 1 1 100%;
    justify-content: center;
    padding-left: 0;
  }

  .header .start-btn {
    flex: 1 1 auto;
    margin-right: 0;
    font-size: 0.85rem;
  }

  .subtext {
    font-size: 1rem;
  }

  .cta-row .cta,
  .pricing-teaser .cta,
  .final-cta .cta {
    width: 100%;
    min-height: 48px;
  }

  .board-columns {
    gap: 0.5rem;
  }

  .board-column {
    padding: 0.5rem;
    min-height: 0;
  }

  .demo-note {
    font-size: 0.72rem;
  }

  .showcase-text h2 {
    font-size: 1.45rem;
  }
}
</style>
