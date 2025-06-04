const express = require('express');
const router = express.Router();
const cinemaController = require('../controllers/cinemaController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', cinemaController.getCinemas);
router.get('/:id', cinemaController.getCinema);
router.get('/:cinemaId/rooms/:roomId', cinemaController.getRoom);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', cinemaController.createCinema);
router.put('/:id', cinemaController.updateCinema);
router.delete('/:id', cinemaController.deleteCinema);

router.post('/:cinemaId/rooms', cinemaController.addRoom);
router.put('/:cinemaId/rooms/:roomId', cinemaController.updateRoom);
router.delete('/:cinemaId/rooms/:roomId', cinemaController.deleteRoom);

module.exports = router; 