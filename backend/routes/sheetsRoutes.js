const express = require('express');
const router  = express.Router();
const { previewSheet, importSheet } = require('../controllers/sheetsController');
const { protect, canUpload } = require('../middleware/auth');
router.post('/preview', protect, canUpload, previewSheet);
router.post('/import',  protect, canUpload, importSheet);
module.exports = router;
