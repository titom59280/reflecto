const express = require('express');
const router = express.Router();
const controller = require('../controllers/memberController');
const auth = require('../middlewares/auth');
const requireScrumMaster = require('../middlewares/requireScrumMaster');

router.get('/', auth, requireScrumMaster, controller.getAll);
router.post('/check-email', controller.checkEmail);
router.put('/update-password', controller.updatePassword);
router.post('/', auth, requireScrumMaster, controller.create);
router.put('/:id',auth, requireScrumMaster, controller.update);
router.delete('/:id', auth, requireScrumMaster, controller.remove);

module.exports = router;
