const express = require('express');
const router = express.Router();
const controller = require('../controllers/linkController');
const auth = require('../middlewares/auth');
const requireScrumMaster = require('../middlewares/requireScrumMaster');

router.get('/', auth, controller.getAll);
router.get('/user/:userId', auth, controller.getForUser);
router.get('/team/:teamId', auth, controller.getForTeam);
router.get('/getNextSprintName/:currentLinkId/:teamId', auth, controller.getNextSprintName);
router.post('/', auth, requireScrumMaster, controller.create);
router.post('/activate', auth, requireScrumMaster, controller.activate)
router.delete('/:id', auth, requireScrumMaster, controller.remove);

router.put('/StartRetro/', auth, requireScrumMaster, controller.markRetroStart);
router.put('/mark-retro-done/', auth, requireScrumMaster, controller.markRetroDone);
router.put('/mark-closed/', auth, requireScrumMaster, controller.markClosed);

module.exports = router;
