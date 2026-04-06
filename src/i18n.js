import { createI18n } from 'vue-i18n';
const messages = {
  en: {
    title: 'titre-en',
  },
  fr: {
    landingPage: {
      titreSection1: 'Libérez la puissance de',
      titreSection2: 'vos rétrospectives',
      descriptionSection1: 'Faites passer vos rétrospectives au niveau supérieur avec',
      descriptionSection2:
        ', l’outil pensé pour les équipes agiles. Renforcez la collaboration, améliorez la communication et facilitez la prise de décision pour une dynamique fluide à chaque sprint.',
      pourquoi: 'Pourquoi Reflecto ?',
      raison1: 'Dites adieu aux Post-it et au chaos',
      raison2:
        'Fini les murs recouverts de papiers qui disparaissent après chaque sprint. Avec Reflecto, centralisez toutes vos rétrospectives en ligne et ne perdez plus jamais vos idées.',
      raison3: 'Simple, flexible et fait pour vous',
      raison4:
        'Pas besoin de formation ni d’outils complexes. Reflecto s’adapte à votre manière de travailler : personnalisez vos catégories, vos sprints et vos équipes facilement.',
      raison5: 'Engagez votre équipe, sans compromis écologique',
      raison6:
        'Stimulez la participation, gardez une trace dans le temps et dites au revoir au gaspillage de papier. Une solution moderne, responsable et accessible à tous.',
      apercu: 'Aperçu de l’application',
    },
    contact: {
      button: 'Contact',
      titre: 'Une question ? Une idée ? Nous sommes à l’écoute !',
      description1:
        'Notre équipe se tient prête à vous accompagner dans votre aventure avec Reflecto.',
      description2:
        'Que ce soit pour une demande d’information, une suggestion d’amélioration, ou une partenariat potentiel, nous vous répondrons dans les plus brefs délais.',
      description3: 'Ensemble, faisons de vos rétrospectives un moteur de progrès continu !',
      restonsEnContact: 'Restons en contact',
      nom: 'Nom',
      email: 'Email',
      message: 'Message',
      envoyer: 'Envoyer',
    },
    nosOffres: {
      title: 'Nos offres',
      mensuel: 'Mensuel',
      annuel: 'Annuel',
      monthes: 'mois',
      freeLabel: 'gratuits',
      free: 'Gratuit',
      standard: 'Standard',
      pro: 'Pro',
      ideal: 'Idéal pour essayer',
      petitesStructures: 'Pour les petites structures',
      illimite: 'Toute l’application en illimité',
      essayer: 'Essayer',
      contacter: 'Nous contacter',
      multiEquipes: 'Multi-équipes',
      membresIllimites: 'Membres illimités',
      imageCategories: 'Image dans les catégories',
      support: 'Support prioritaire',
    },
    connection: {
      titre: 'Rejoignez l’aventure Reflecto',
      description1:
        'Simplifiez vos rétrospectives agiles, engagez vos équipes, et transformez chaque sprint en opportunité d’amélioration continue.',
      description2:
        'Créez un compte gratuitement dès maintenant ou connectez-vous si vous avez déjà accès à un espace Reflecto.',
      description3:
        'Une fois que vous serez convaincue par notre outils, contactez nous pour en faire profiter toute votre équipe.',
    },
    formulaireConnection: {
      titre: 'Bienvenue sur Reflecto',
      connection: 'Connexion',
      inscriptionUtilisateur: 'Inscription utilisateur',
      inscriptionEntreprise: 'Inscription entreprise',
      email: 'Email',
      motDePasse: 'Mot de passe',
      confirmerMotDePasse: 'Confirmer le mot de passe',
      nomEntreprise: 'Nom de l’entreprise',
      nomEquipe: 'Nom de l’équipe',
      emailScrumMaster: 'Email du Scrum Master',
      nomScrumMaster: 'Nom du Scrum Master',
      trigrammeScrumMaster: 'Trigramme du Scrum Master',
      inscription: 'S’inscrire',
    },
    legales: {
      titre: 'Mentions légales',
      editeurSite: 'Éditeur du site',
      description1: 'Le présent site,',
      description1bis: 'est édité par :',
      nom: 'Nom :',
      adresse: 'Adresse :',
      email: 'Email :',
      SIRET: 'SIRET :',
      hebergement: 'Hébergement',
      description2: 'Le site est hébergé par :',
      nomHebergeur: 'Nom de l’hébergeur :',
      adresseHebergeur: 'Adresse de l’hébergeur :',
      proprieteIntellectuelle: 'Propriété intellectuelle',
      description3:
        'L’ensemble des contenus présents sur ce site (textes, images, logos, illustrations, vidéos) sont protégés par les lois en vigueur sur la propriété intellectuelle et restent la propriété exclusive de Reflecto, sauf mention contraire. Toute reproduction ou utilisation sans autorisation préalable est interdite.',
      donneespersonnelles: 'Données personnelles',
      description4:
        'Les données personnelles collectées via ce site sont utilisées uniquement dans le cadre du service Reflecto et ne sont jamais revendues à des tiers. Conformément au RGPD, vous pouvez demander la consultation, la modification ou la suppression de vos données en nous contactant via le formulaire de contact : ',
      responsabilite: 'Responsabilité',
      description5:
        'Reflecto met tout en œuvre pour assurer l’exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, nous ne saurions être tenus responsables des éventuelles erreurs ou omissions.',
    },
    equipe: 'équipe',
    membres: 'membres',
    retour: 'Retour',
    tousDroitsReserves: 'Tous droits réservés',
    accueil: 'Accueil',
    mentionLegale: 'Mentions légales',
    seConnecter: 'Se connecter',
    commencer: 'Commencer',
    demanderDemo: 'Demander une démo',
  },
};

const navLang = navigator.language.split('-')[0];
const locale = messages[navLang] ? navLang : 'en';

const i18n = createI18n({
  legacy: false,
  locale: locale,
  fallbackLocale: 'en',
  messages,
});

export default i18n;
