const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');


// Routes cho payment callback (không yêu cầu auth)
router.use(express.raw({ type: 'application/json' })); // Cho Momo và ZaloPay
router.get('/vnpay/payment-return', bookingController.handleVNPayCallback);
router.post('/payment/momo/callback', bookingController.handleMomoCallback);
router.post('/payment/zalopay/callback', bookingController.handleZaloPayCallback);



// Tất cả các routes đều yêu cầu đăng nhập
router.use(protect);

// Routes cho user
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/:id', bookingController.getBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);

// Route cho cron job (cần bảo vệ bằng API key)
router.post('/cron/handle-expired', bookingController.handleExpiredBookings);

module.exports = router; 