import axios from 'axios';
const API_BASE = process.env.VUE_APP_API_BASE_URL_API;

const tokenKey = 'retro-token';
const userKey = 'retro-user';

const instance = axios.create({
  baseURL: API_BASE,
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.error === 'Token invalide'
    ) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  instance,
  saveUser(user, token = 'secure-dev-token') {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
  },
  getUser() {
    const userLocal = localStorage.getItem(userKey);
    if (!userLocal || userLocal === 'undefined') {
      return undefined;
    }
    return JSON.parse(userLocal);
  },
  logout() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  },
};
