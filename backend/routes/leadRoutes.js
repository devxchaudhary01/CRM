const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const {
  getLeads, createLead, updateLead, deleteLead,
  uploadLeads, downloadLeads,
  getOrgColumns, addOrgColumn, deleteOrgColumn,
  getAnalytics, getActivities, getDailyReport,
} = require('../controllers/leadController');
const { protect, canUpload, canDownload, isSuperAdmin, canWork, canManageOrg } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 10*1024*1024 },
  fileFilter: (req, file, cb) => {
    ['.xlsx','.xls','.csv'].includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true) : cb(new Error('Excel/CSV only'));
  },
});

// Analytics + reporting
router.get('/analytics',    protect,            getAnalytics);
router.get('/activities',   protect,            getActivities);
router.get('/daily-report', protect,            getDailyReport);

// Download
router.get('/download',     protect, canDownload, downloadLeads);

// Upload
router.post('/upload',      protect, canUpload, upload.single('file'), uploadLeads);

// Custom columns (org_owner / ops_manager)
router.get('/org-columns',         protect, canManageOrg, getOrgColumns);
router.post('/org-columns',        protect, canManageOrg, addOrgColumn);
router.delete('/org-columns/:key', protect, canManageOrg, deleteOrgColumn);

// CRUD
router.route('/')
  .get(protect, getLeads)
  .post(protect, canUpload, createLead);

router.route('/:id')
  .put(protect, canWork, updateLead)
  .delete(protect, isSuperAdmin, deleteLead);

module.exports = router;
