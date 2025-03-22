const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// User routes
router.get('/my-bookings', bookingController.getUserBookings);
router.post('/', bookingController.createBooking);

// Admin routes
router.use(authController.restrictTo('admin'));
router.get('/', bookingController.getAllBookings);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.patch('/:id/payment', bookingController.updatePaymentStatus);

module.exports = router;