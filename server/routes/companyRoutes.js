const express = require('express');
const router = express.Router();
const controller = require('../controllers/companyController');
const auth = require('../middlewares/auth');
const requireFullAdmin = require('../middlewares/requireFullAdmin');
const requireScrumMaster = require('../middlewares/requireScrumMaster');

router.get('/', auth, requireFullAdmin, controller.getAll);
router.get('/stats', auth, requireFullAdmin, controller.getPlatformStats);
router.get('/getCompanie', auth, requireScrumMaster, controller.getCompanieForUser);
router.post('/', controller.create);
router.post('/admin', auth, requireFullAdmin, controller.adminCreate);
router.put('/', auth, requireFullAdmin, controller.update);

module.exports = router;
