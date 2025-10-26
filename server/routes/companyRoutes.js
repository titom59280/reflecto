const express = require('express');
const router = express.Router();
const controller = require('../controllers/companyController');
const auth = require('../middlewares/auth');
const requireFullAdmin = require('../middlewares/requireFullAdmin');

router.get('/', auth, requireFullAdmin, controller.getAll);
router.post('/', controller.create);
router.put('/', auth, requireFullAdmin, controller.update);
router.delete('/:id', auth, requireFullAdmin, controller.remove);

module.exports = router;
