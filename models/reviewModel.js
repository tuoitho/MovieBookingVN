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

// Compound index to ensure one review per user per movie
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

// Index for efficient querying of movie reviews
reviewSchema.index({ movieId: 1, createdAt: -1 });

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function(movieId) {
    const stats = await this.aggregate([
        {
            $match: { movieId: new mongoose.Types.ObjectId(movieId) }
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
        await mongoose.model('Movie').findByIdAndUpdate(movieId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            totalReviews: stats[0].totalReviews
        });
    } else {
        await mongoose.model('Movie').findByIdAndUpdate(movieId, {
            averageRating: 0,
            totalReviews: 0
        });
    }
};

// Call calculateAverageRating after save
reviewSchema.post('save', function() {
    this.constructor.calculateAverageRating(this.movieId);
});

// Call calculateAverageRating before remove
reviewSchema.pre('remove', function() {
    this.constructor.calculateAverageRating(this.movieId);
});

// Virtual populate
reviewSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Set toJSON option to include virtuals
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', reviewSchema); 