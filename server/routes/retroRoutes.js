const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/retroController');
const auth = require('../middlewares/auth');
const requireScrumMaster = require('../middlewares/requireScrumMaster');
const upload = multer({ dest: 'uploads/' });
router.get('/', auth, controller.getAll);
router.post('/', auth, requireScrumMaster,upload.any(),controller.create);
router.delete('/:id', auth, requireScrumMaster, controller.remove);

module.exports = router;
