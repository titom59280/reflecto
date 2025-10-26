const express = require('express');
const router = express.Router();
const controller = require('../controllers/sprintController');
const auth = require('../middlewares/auth');
const requireScrumMaster = require('../middlewares/requireScrumMaster');

router.get('/', auth, controller.getAll);
router.post('/', auth, requireScrumMaster, controller.create);
router.delete('/:id', auth, requireScrumMaster, controller.remove);

module.exports = router;
