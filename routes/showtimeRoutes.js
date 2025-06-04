const express = require('express');
const router = express.Router();
const showtimeController = require('../controllers/showtimeController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', showtimeController.getShowtimes);
router.get('/:id', showtimeController.getShowtime);
router.get('/movie/:movieId', showtimeController.getShowtimesByMovie);

// Protected routes (User)
router.use(protect);
router.patch('/:showtimeId/seats', showtimeController.checkAndUpdateSeats);

// Protected routes (Admin only)
router.use(restrictTo('admin'));
router.post('/', showtimeController.createShowtime);
router.put('/:id', showtimeController.updateShowtime);
router.delete('/:id', showtimeController.deleteShowtime);

module.exports = router; 