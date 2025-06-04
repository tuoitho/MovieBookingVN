const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const reviewRouter = require('./reviewRoutes');

// Public routes
router.get('/', movieController.getMovies);
router.get('/search', movieController.searchMovies);
router.get('/now-showing', movieController.getNowShowingMovies);
router.get('/coming-soon', movieController.getComingSoonMovies);
router.get('/slug/:slug', movieController.getMovieBySlug);
router.get('/:id', movieController.getMovie);

// Review routes (một số cần xác thực, một số không)
router.use('/:movieId/reviews', reviewRouter);
// GET {{baseUrl}}/movies/{{movieId}}/my-review
router.get('/:movieId/my-review', protect, reviewController.getUserReviewForMovie);


// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', movieController.createMovie);
router.put('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router; 