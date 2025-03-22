const express = require('express');
const showtimeController = require('../controllers/showtimeController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/', showtimeController.getAllShowtimes);
router.get('/:id', showtimeController.getShowtime);
router.get('/movie/:movieId', showtimeController.getShowtimesByMovie);
router.get('/available', showtimeController.getAvailableShowtimes);

// Protected routes (admin only)
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.post('/', showtimeController.createShowtime);
router.patch('/:id', showtimeController.updateShowtime);
router.delete('/:id', showtimeController.deleteShowtime);

module.exports = router;