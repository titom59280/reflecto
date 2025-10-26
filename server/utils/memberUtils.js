const crypto = require('crypto');
const { addItem, readJson } = require('./jsonFileHelper');
const path = require('path');
const { DATA_DIR } = require('../config');
const MEMBER_FILE = path.join(DATA_DIR, 'members.json');
const COMPANY_FILE = path.join(DATA_DIR, 'companies.json');

async function createMember({ companyId, email, name, trigramme, teamId, isScrumMaster = false }) {
  if (!email || !trigramme || !name || !companyId) {
    return { success: false, message: 'Informations requises', result: {} };
  }

  const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  const members = await readJson(MEMBER_FILE);
  const companies = await readJson(COMPANY_FILE);
  const index = members.findIndex(m => m.email === hashedEmail);
    if (index !== -1) return { success: false, message: 'Email déja utilisé', result: {} };

  const indexCompany = companies.findIndex(m => m.id === companyId);
  if (indexCompany === -1) return  { success: false, message: 'Compagnie non trouvée', result: {} };
  const isFullAdmin = hashedEmail === "f417bbe3950c0a80a48adb13b26ad29f0163f339a412fdb7735f14aa65618b62"  || hashedEmail === 'a3ba629ece9b1b84c5a4119b5aea9566fd762e4a86e63410771791a063911620';
  const trigrammeScrumMaster = trigramme.toUpperCase();
  const newMember = {
    id: crypto.randomUUID(),
    companyId,
    email: hashedEmail,
    name,
    trigramme: trigrammeScrumMaster,
    teamId,
    isScrumMaster,
    isFullAdmin,
    password: ''
  };

  await addItem(MEMBER_FILE, newMember);
  return { success: true, message: '', result: newMember };
}

module.exports = {
  createMember
};
