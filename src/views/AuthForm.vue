<template>
  <div class="container login-form">
    <h2 class="text-center">{{ $t('formulaireConnection.titre') }}</h2>

    <div class="tabs">
      <button :class="['tab-button', tab === 'login' ? 'active' : '']" @click="changeTab('login')">
        {{ $t('formulaireConnection.connection') }}
      </button>
      <button
        :class="['tab-button', tab === 'register' ? 'active' : '']"
        @click="changeTab('register')"
      >
        {{ $t('formulaireConnection.inscriptionUtilisateur') }}
      </button>
      <button
        :class="['tab-button', tab === 'registerCompany' ? 'active' : '']"
        @click="changeTab('registerCompany')"
      >
        {{ $t('formulaireConnection.inscriptionEntreprise') }}
      </button>
    </div>
    <form
      class="form-login"
      @submit.prevent="
        tab === 'login' ? login() : tab === 'register' ? register() : registerCompany()
      "
    >
      <div class="fields">
        <div v-if="tab === 'registerCompany'">
          <label>{{ $t('formulaireConnection.nomEntreprise') }} *</label>
          <input v-model="companyName" type="text" class="input" required />
        </div>
        <div v-if="tab === 'registerCompany'">
          <label>{{ $t('formulaireConnection.nomEquipe') }} *</label>
          <input v-model="teamName" type="text" class="input" required />
        </div>
        <div v-if="tab !== 'registerCompany'">
          <label>{{ $t('formulaireConnection.email') }} *</label>
          <input v-model="email" type="email" class="input" required />
        </div>
        <div v-else>
          <label>{{ $t('formulaireConnection.emailScrumMaster') }} *</label>
          <input v-model="scrumMasterEmail" type="email" class="input" required />
        </div>
        <div v-if="tab !== 'registerCompany'">
          <label>{{ $t('formulaireConnection.motDePasse') }} *</label>
          <input v-model="password" autocomplete="on" type="password" class="input" required />
        </div>
        <div v-if="tab === 'register'">
          <label>{{ $t('formulaireConnection.confirmerMotDePasse') }} *</label>
          <input
            v-model="confirmMotDepasse"
            autocomplete="on"
            type="password"
            class="input"
            required
          />
        </div>
        <div v-if="tab === 'registerCompany'">
          <label>{{ $t('formulaireConnection.nomScrumMaster') }} *</label>
          <input v-model="scrumMasterName" type="text" class="input" required />
        </div>
        <div v-if="tab === 'registerCompany'">
          <label>{{ $t('formulaireConnection.trigrammeScrumMaster') }} *</label>
          <input
            v-model="scrumMasterTrigramme"
            type="text"
            minlength="3"
            maxlength="3"
            class="input"
            required
          />
        </div>
      </div>
      <button type="submit" class="button-primary">
        {{ tab === 'login' ? $t('seConnecter') : $t('formulaireConnection.inscription') }}
      </button>
    </form>
  </div>
</template>

<script>
import services from '@/services/service';
import authService from '@/services/authService';
export default {
  data() {
    return {
      email: '',
      tab: 'login',
      password: '',
      confirmMotDepasse: '',
      scrumMasterEmail: '',
      scrumMasterName: '',
      scrumMasterTrigramme: '',
      companyName: '',
      teamName: '',
    };
  },
  mounted() {
    if (this.$store.getters.showFormCompany) {
      this.tab = 'registerCompany';
      this.$store.dispatch('setShowFormCompany', false);
    }
  },
  methods: {
    async login() {
      try {
        const res = await services.login(this.email, this.password);
        if (!res.isSuccess) {
          this.$root.showToast(this.$apiMessage(res), 'error');
          return;
        }
        authService.saveUser(res.result.user, res.result.token);
        this.$store.dispatch('setShowFormConnection', false);
        this.$store.dispatch('updateMemberColor', res.result.user.color);
        this.$router.push('/retro');
      } catch (err) {
        this.$root.showToast(
          err.response?.data?.code
            ? this.$apiMessage(err.response.data)
            : this.$t('formulaireConnection.erreurConnexion'),
          'error'
        );
      }
    },
    async register() {
      try {
        if (this.password !== this.confirmMotDepasse) {
          this.$root.showToast(this.$t('formulaireConnection.motsDePasseDifferents'), 'error');
          return;
        }
        const res = await services.checkMemberEmail(this.email, false);
        if (!res.isSuccess) {
          this.$root.showToast(this.$apiMessage(res), 'error');
          return;
        }

        const resUser = await services.updateMemberPassword(this.email, this.password);

        if (!resUser.isSuccess) {
          this.$root.showToast(this.$apiMessage(resUser), 'error');
          return;
        }

        authService.saveUser(resUser.result.user, resUser.result.token);
        this.$router.push('/retro');
      } catch (err) {
        this.$root.showToast(this.$t('formulaireConnection.erreurInscription'), 'error');
      }
    },
    async registerCompany() {
      try {
        const res = await services.checkMemberEmail(this.scrumMasterEmail, true);
        if (!res.isSuccess) {
          this.$root.showToast(this.$apiMessage(res), 'error');
          return;
        }

        const resCreateCompany = await services.createCompany({
          companyName: this.companyName,
          scrumMasterEmail: this.scrumMasterEmail,
          scrumMasterName: this.scrumMasterName,
          scrumMasterTrigramme: this.scrumMasterTrigramme,
          teamName: this.teamName,
        });

        if (!resCreateCompany.isSuccess) {
          this.$root.showToast(this.$apiMessage(resCreateCompany), 'error');
          return;
        }

        this.scrumMasterEmail = '';
        this.scrumMasterName = '';
        this.scrumMasterTrigramme = '';
        this.companyName = '';
        this.teamName = '';
        this.tab = 'register';

        this.$root.showToast(this.$apiMessage(resCreateCompany), 'success');
      } catch (err) {
        this.$root.showToast(this.$t('formulaireConnection.erreurInscription'), 'error');
      }
    },
    changeTab(element) {
      this.tab = element;
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

/* ===== Responsive ===== */
@media (max-width: 768px) {
  /* Libellés d'onglets longs ("Inscription entreprise") : retour à la ligne propre */
  .tab-button {
    min-height: 44px;
    font-size: 0.85rem;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
}

@media (max-width: 480px) {
  .tab-button {
    font-size: 0.9rem;
  }
}
</style>
