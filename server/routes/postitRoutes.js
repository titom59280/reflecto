const express = require('express');
const router = express.Router();
const controller = require('../controllers/postitController');
const auth = require('../middlewares/auth');

router.get('/me/:linkId', auth, controller.getMine);
router.get('/all/:linkId', auth, controller.getAllByLink);

router.post('/', auth, controller.create);
router.put('/', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
