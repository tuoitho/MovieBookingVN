const reviewService = require('../services/reviewService');
const catchAsync = require('../utils/catchAsync');
const { validateReview } = require('../utils/validation');

const reviewController = {
    // [POST] /api/v1/movies/:movieId/reviews
    createReview: catchAsync(async (req, res) => {
        const { error } = validateReview(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }

        const review = await reviewService.createReview(
            req.user.id,
            req.params.movieId,
            req.body
        );

        res.status(201).json({
            status: 'success',
            data: review
        });
    }),

    // [PUT] /api/v1/reviews/:reviewId
    updateReview: catchAsync(async (req, res) => {
        const { error } = validateReview(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }

        const review = await reviewService.updateReview(
            req.user.id,
            req.params.reviewId,
            req.body
        );

        res.json({
            status: 'success',
            data: review
        });
    }),

    // [DELETE] /api/v1/reviews/:reviewId
    deleteReview: catchAsync(async (req, res) => {
        const result = await reviewService.deleteReview(
            req.user.id,
            req.params.reviewId
        );

        res.json({
            status: 'success',
            data: result
        });
    }),

    // [GET] /api/v1/movies/:movieId/reviews
    getMovieReviews: catchAsync(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await reviewService.getMovieReviews(
            req.params.movieId,
            page,
            limit
        );

        res.json({
            status: 'success',
            data: result
        });
    }),

    // [GET] /api/v1/movies/:movieId/my-review
    getUserReviewForMovie: catchAsync(async (req, res) => {
        console.log(req.user.id, req.params.movieId);
        const review = await reviewService.getUserReviewForMovie(
            req.user.id,
            req.params.movieId
        );

        res.json({
            status: 'success',
            data: review
        });
    }),

    // [GET] /api/v1/users/me/reviews
    getUserReviews: catchAsync(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await reviewService.getUserReviews(
            req.user.id,
            page,
            limit
        );

        res.json({
            status: 'success',
            data: result
        });
    })
};

module.exports = reviewController; 