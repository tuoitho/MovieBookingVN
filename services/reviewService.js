const Review = require('../models/reviewModel');
const Movie = require('../models/movieModel');
const ApiError = require('../utils/ApiError');

class ReviewService {
    // Tạo review mới
    async createReview(userId, movieId, reviewData) {
        // Kiểm tra phim có tồn tại không
        const movie = await Movie.findById(movieId);
        if (!movie) {
            throw new ApiError(404, 'Không tìm thấy phim');
        }

        // Kiểm tra xem user đã review phim này chưa
        const existingReview = await Review.findOne({ userId, movieId });
        if (existingReview) {
            throw new ApiError(400, 'Bạn đã đánh giá phim này rồi');
        }

        // Tạo review mới
        const review = await Review.create({
            userId,
            movieId,
            rating: reviewData.rating,
            comment: reviewData.comment
        });

        return review;
    }

    // Cập nhật review
    async updateReview(userId, reviewId, reviewData) {
        const review = await Review.findById(reviewId);
        
        if (!review) {
            throw new ApiError(404, 'Không tìm thấy đánh giá');
        }

        // Kiểm tra xem review có phải của user không
        if (review.userId.toString() !== userId.toString()) {
            throw new ApiError(403, 'Bạn không có quyền cập nhật đánh giá này');
        }

        // Cập nhật review
        review.rating = reviewData.rating;
        review.comment = reviewData.comment;
        await review.save();

        return review;
    }

    // Xóa review
    async deleteReview(userId, reviewId) {
        const review = await Review.findById(reviewId);
        
        if (!review) {
            throw new ApiError(404, 'Không tìm thấy đánh giá');
        }

        // Kiểm tra xem review có phải của user không
        if (review.userId.toString() !== userId.toString()) {
            throw new ApiError(403, 'Bạn không có quyền xóa đánh giá này');
        }

        await review.remove();
        return { message: 'Đã xóa đánh giá thành công' };
    }

    // Lấy tất cả review của một phim
    async getMovieReviews(movieId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ movieId })
            .populate('userId', 'fullName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ movieId });

        return {
            reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalReviews: total
            }
        };
    }

    // Lấy review của user cho một phim cụ thể
    async getUserReviewForMovie(userId, movieId) {
        const review = await Review.findOne({ userId, movieId });
        return review;
    }

    // Lấy tất cả review của một user
    async getUserReviews(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ userId })
            .populate('movieId', 'title posterUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ userId });

        return {
            reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalReviews: total
            }
        };
    }
}

module.exports = new ReviewService(); 