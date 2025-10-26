module.exports = function requireScrumMaster(req, res, next) {
  if (!req.user || !req.user.isScrumMaster) {
    return res.status(403).json({ error: 'Droits Scrum Master requis' });
  }
  next();
}