const express = require('express');
const router = express.Router();
const controller = require('../controllers/teamController');
const auth = require('../middlewares/auth');
const requireScrumMaster = require('../middlewares/requireScrumMaster');

router.get('/', auth, controller.getAll);
router.get('/with-members',auth, requireScrumMaster, controller.getAllWithMembers);
router.post('/', auth, requireScrumMaster, controller.create);
router.put('/:id', auth, requireScrumMaster, controller.update);
router.delete('/:id', auth, requireScrumMaster, controller.remove);

module.exports = router;
