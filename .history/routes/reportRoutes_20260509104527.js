const express = require('express');
const { getDailyReport, getRevenueSummary, getActiveParkingReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/daily-payments', getDailyReport);
router.get('/revenue-summary', authorize('admin'), getRevenueSummary);
router.get('/active-parking', getActiveParkingReport);

module.exports = router;