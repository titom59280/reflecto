import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';
import './assets/main.css';
import '@fortawesome/fontawesome-free/css/all.css';
import i18n from './i18n';

createApp(App).use(store).use(router).use(i18n).mount('#app');
