const crypto = require('crypto');
const pool = require('../utils/dbHelper');

async function createMember({ companyId, email, name, trigramme, teamId, isScrumMaster = false }) {
  if (!email || !trigramme || !name || !companyId) {
    return {
      success: false,
      message: 'Informations requises',
      code: 'MEMBER_INFO_REQUIRED',
      result: {},
    };
  }

  const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  const member = await pool.queryOne('SELECT * FROM members WHERE email = $1', [hashedEmail]);
  if (member)
    return {
      success: false,
      message: 'Email déja utilisé',
      code: 'EMAIL_ALREADY_USED',
      result: {},
    };

  const companies = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
  if (companies.length === 0)
    return {
      success: false,
      message: 'Compagnie non trouvée',
      code: 'COMPANY_NOT_FOUND',
      result: {},
    };
  // Le droit d'administration de la plateforme n'est jamais attribué à la création d'un compte :
  // il se donne uniquement à la main, en base (cf. server/migrations/002_compagnie_interne.sql)
  const isFullAdmin = false;
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
    password: '',
  };

  await pool.query(
    "INSERT INTO members (id, companyId, email, name, trigramme, teamId, isScrumMaster, isFullAdmin, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '')",
    [
      newMember.id,
      companyId,
      hashedEmail,
      name,
      trigrammeScrumMaster,
      teamId,
      isScrumMaster,
      isFullAdmin,
    ]
  );
  return { success: true, message: '', result: newMember };
}

module.exports = {
  createMember,
};
