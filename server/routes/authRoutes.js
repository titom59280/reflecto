const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');

router.post('/login', controller.login);
router.post('/sendContact', controller.contact);
router.post('/test', controller.test);
router.get('/testapi', controller.testapi);
module.exports = router;
