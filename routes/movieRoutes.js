const express = require('express');
const movieController = require('../controllers/movieController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovie);
router.get('/status/:status', movieController.getMoviesByStatus);

// Protected routes (admin only)
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.post('/', movieController.createMovie);
router.patch('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router;