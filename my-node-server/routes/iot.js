const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');

// Pastikan baris ini ada [cite: 271]
router.post('/data', iotController.receiveSensorData); 
router.get('/history', iotController.getSensorHistory);

module.exports = router;