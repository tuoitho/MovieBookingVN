const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', movieController.getMovies);
router.get('/search', movieController.searchMovies);
router.get('/now-showing', movieController.getNowShowingMovies);
router.get('/coming-soon', movieController.getComingSoonMovies);
router.get('/slug/:slug', movieController.getMovieBySlug);
router.get('/:id', movieController.getMovie);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', movieController.createMovie);
router.put('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router; 