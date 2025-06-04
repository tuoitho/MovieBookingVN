const express = require('express');
const router = express.Router({ mergeParams: true }); // Để có thể truy cập params từ parent router
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
// GET /api/v1/movies/:movieId/reviews
router.get('/', reviewController.getMovieReviews);

// Protected routes (yêu cầu đăng nhập)
// POST /api/v1/movies/:movieId/reviews
router.post('/', protect, reviewController.createReview);

// GET /api/v1/movies/:movieId/my-review
router.get('/my-review', protect, reviewController.getUserReviewForMovie);

// GET /api/v1/users/me/reviews
router.get('/me/reviews', protect, reviewController.getUserReviews);

// Routes cho thao tác với một review cụ thể
// PUT /api/v1/reviews/:reviewId
// DELETE /api/v1/reviews/:reviewId
router.route('/:reviewId')
    .put(protect, reviewController.updateReview)
    .delete(protect, reviewController.deleteReview);

// Middleware để kiểm tra movieId khi tạo review
router.use((req, res, next) => {
    if (!req.params.movieId && req.method === 'POST') {
        return res.status(400).json({
            status: 'error',
            message: 'Không thể tạo review mà không có movieId'
        });
    }
    next();
});

module.exports = router; 