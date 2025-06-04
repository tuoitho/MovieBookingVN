const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Một người dùng chỉ được đánh giá một phim một lần
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

// Middleware để cập nhật averageRating và totalReviews của Movie
reviewSchema.post('save', async function() {
    const Movie = mongoose.model('Movie');
    
    // Tính rating trung bình mới
    const stats = await this.constructor.aggregate([
        {
            $match: { movieId: this.movieId }
        },
        {
            $group: {
                _id: '$movieId',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await Movie.findByIdAndUpdate(this.movieId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10, // Làm tròn 1 chữ số thập phân
            totalReviews: stats[0].totalReviews
        });
    } else {
        await Movie.findByIdAndUpdate(this.movieId, {
            averageRating: 0,
            totalReviews: 0
        });
    }
});

// Middleware để cập nhật khi xóa review
reviewSchema.post('remove', async function() {
    await this.constructor.post('save').call(this);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 