const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'very-secret-key';
function generateToken(user) {
  return jwt.sign({ 
    id: user.id,
    email: user.email,
    teamId: user.teamId,
    companyId: user.companyId,
    isScrumMaster: user.isScrumMaster,
    isFullAdmin: user.isFullAdmin,
  }, 
  SECRET, 
  { expiresIn: '2h' });
}

module.exports = {
  generateToken
};
