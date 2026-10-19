import { createStore } from 'vuex';

const store = createStore({
  state: {
    isShowBack: false,
    showFormConnection: false,
    showFormCompany: false,
    memberColor: '#FFF89A',
  },
  mutations: {
    SET_SHOW_FORM_COMPANY(state, value) {
      state.showFormCompany = value;
    },
    SET_SHOW_FORM_CONNECTION(state, value) {
      state.showFormConnection = value;
    },
    SET_TOGGLE(state, value) {
      state.isShowBack = value;
    },
    SET_MEMBER_COLOR(state, color) {
      state.memberColor = color;
    },
  },
  actions: {
    setShowFormConnection({ commit }, value) {
      commit('SET_SHOW_FORM_CONNECTION', value);
    },
    setShowFormCompany({ commit }, value) {
      commit('SET_SHOW_FORM_COMPANY', value);
    },
    // Action pour activer le toggle
    activateToggle({ commit }) {
      commit('SET_TOGGLE', true);
    },
    // Action pour désactiver le toggle
    deactivateToggle({ commit }) {
      commit('SET_TOGGLE', false);
    },
    toggleShowBack({ commit, state }) {
      commit('SET_TOGGLE', !state.isShowBack);
    },
    updateMemberColor({ commit }, color) {
      commit('SET_MEMBER_COLOR', color);
    },
  },
  getters: {
    showFormConnection: (state) => state.showFormConnection,
    showFormCompany: (state) => state.showFormCompany,
    isShowBack: (state) => state.isShowBack,
  },
});

export default store;
