const express = require('express');
const { generateToken, clearToken } = require('../controllers/authController');
const router = express.Router();

router.post('/jwt', generateToken);
router.post('/logout', clearToken);

module.exports = router;
