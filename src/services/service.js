import authService from './authService';

export default {
  async sendContact(name, email, message) {
    const res = await authService.instance.post('/sendContact', { name, email, message });
    return res.data;
  },
  // 🔐 Login verification
  async login(email, password) {
    const res = await authService.instance.post(`/login`, { email, password });
    return res.data;
  },
  async register(data) {
    const res = await authService.instance.post(`/register`, data);
    return res.data;
  },
  async checkMemberEmail(email, forCompagnie) {
    const res = await authService.instance.post(`/members/check-email`, { email, forCompagnie });
    return res.data;
  },
  async createCompany(company) {
    const res = await authService.instance.post(`/companies`, company);
    return res.data;
  },
  async updateMemberPassword(email, password) {
    const res = await authService.instance.put(`/members/update-password`, { email, password });
    return res.data;
  },
};
