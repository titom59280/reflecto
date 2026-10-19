import { createI18n } from 'vue-i18n';

export const SUPPORTED_LOCALES = ['en', 'fr', 'es'];
const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'reflecto-lang';

// Charge src/locales/<langue>/<zone>.json et fusionne les zones par langue.
// Chaque fichier possède ses propres clés racines (board, admin, api, ...).
function loadMessages() {
  const context = require.context('./locales', true, /^\.\/[a-z]{2}\/[\w-]+\.json$/);
  const messages = {};
  context.keys().forEach((key) => {
    const lang = key.split('/')[1];
    messages[lang] = { ...messages[lang], ...context(key) };
  });
  return messages;
}

function readStoredLocale() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Ordre : choix mémorisé > langues du navigateur > anglais
function detectLocale() {
  const stored = readStoredLocale();
  if (SUPPORTED_LOCALES.includes(stored)) return stored;

  const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
  const match = browserLangs
    .map((lang) => (lang || '').split('-')[0].toLowerCase())
    .find((lang) => SUPPORTED_LOCALES.includes(lang));
  return match || DEFAULT_LOCALE;
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: loadMessages(),
});

document.documentElement.lang = i18n.global.locale.value;

export function setLocale(lang) {
  if (!SUPPORTED_LOCALES.includes(lang)) return;
  i18n.global.locale.value = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // stockage indisponible (navigation privée) : le choix vaut pour la session
  }
}

export function getLocale() {
  return i18n.global.locale.value;
}

// Traduit une réponse API { isSuccess, message, code } :
// le code est traduit via api.<code>, sinon on garde le message du serveur.
export function apiMessage(response) {
  const { t, te } = i18n.global;
  const code = response?.code;
  if (code && (te(`api.${code}`) || te(`api.${code}`, DEFAULT_LOCALE))) return t(`api.${code}`);
  return response?.message || t('common.genericError');
}

export default i18n;
