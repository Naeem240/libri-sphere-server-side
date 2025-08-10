const express = require('express');
const { getSubscriptions, addSubscription } = require('../controllers/subscriptionsController');
const router = express.Router();

router.get('/', getSubscriptions);
router.post('/', addSubscription);

module.exports = router;
