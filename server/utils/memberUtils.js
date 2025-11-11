const crypto = require('crypto');
const pool = require('../utils/dbHelper');

async function createMember({ companyId, email, name, trigramme, teamId, isScrumMaster = false }) {
  if (!email || !trigramme || !name || !companyId) {
    return { success: false, message: 'Informations requises', result: {} };
  }

  const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  const member = await pool.queryOne(
    "SELECT * FROM members WHERE email = $1",
    [hashedEmail]
  );
  if (member) return { success: false, message: 'Email déja utilisé', result: {} };

  const companies = await pool.query(
    "SELECT * FROM companies WHERE id = $1",
    [companyId]
  );
  if (!companies) return  { success: false, message: 'Compagnie non trouvée', result: {} };
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

  await pool.query(
    "INSERT INTO members (id, companyId, email, name, trigramme, teamId, isScrumMaster, isFullAdmin, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '')",
    [newMember.id, companyId, hashedEmail, name, trigrammeScrumMaster, teamId, isScrumMaster, isFullAdmin]
  );
  return { success: true, message: '', result: newMember };
}

module.exports = {
  createMember
};
