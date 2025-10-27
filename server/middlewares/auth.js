const jwt = require('jsonwebtoken');
const SECRET = process.env.VUE_APP_JWT_SECRET;

module.exports = function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requis' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token invalide' });
  }
}
