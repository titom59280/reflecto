module.exports = function requireFullAdmin(req, res, next) {
  if (!req.user || !req.user.isFullAdmin) {
    return res.status(403).json({ error: 'Droits Full Admin requis' });
  }
  next();
}
