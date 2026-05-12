const express = require('express');
const { getPayments, getPaymentById, refundPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.post('/:id/refund', authorize('admin'), refundPayment);

module.exports = router;