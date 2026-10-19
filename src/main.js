import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';
import './assets/main.css';
import '@fortawesome/fontawesome-free/css/all.css';
import i18n, { apiMessage } from './i18n';

const app = createApp(App).use(store).use(router).use(i18n);
// Traduction des réponses API : this.$apiMessage(result)
app.config.globalProperties.$apiMessage = apiMessage;
app.mount('#app');
