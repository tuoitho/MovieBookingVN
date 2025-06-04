const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Public routes
router.get('/search', movieController.searchMovies);
router.get('/upcoming', movieController.getUpcomingMovies);
router.get('/now-showing', movieController.getNowShowingMovies);
router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovie);

// Protected routes (admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', movieController.createMovie);
router.patch('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router; 