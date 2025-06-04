const mongoose = require('mongoose');
const slugify = require('slugify');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide movie title'],
        unique: true,
        trim: true
    },
    vietnameseTitle: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide movie description']
    },
    posterUrl: {
        type: String,
        required: [true, 'Please provide movie poster URL']
    },
    bannerUrl: {
        type: String
    },
    trailerUrl: {
        type: String,
        required: [true, 'Please provide movie trailer URL']
    },
    duration: {
        type: Number,
        required: [true, 'Please provide movie duration in minutes']
    },
    releaseDate: {
        type: Date,
        required: [true, 'Please provide release date']
    },
    endDate: {
        type: Date
    },
    genre: {
        type: [String],
        required: [true, 'Please provide at least one genre']
    },
    director: String,
    actors: [String],
    language: {
        type: String,
        required: [true, 'Please provide movie language']
    },
    rating: {
        type: String,
        enum: ['P', 'C13', 'C16', 'C18']
    },
    status: {
        type: String,
        enum: ['now_showing', 'coming_soon', 'ended'],
        default: 'coming_soon'
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5']
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    slug: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Create slug from title before saving
movieSchema.pre('save', function(next) {
    if (!this.isModified('title')) {
        next();
        return;
    }
    this.slug = slugify(this.title, {
        lower: true,
        strict: true
    });
    next();
});

// Automatically update status based on dates
movieSchema.pre('save', function(next) {
    const now = new Date();
    if (this.releaseDate > now) {
        this.status = 'coming_soon';
    } else if (this.endDate && this.endDate < now) {
        this.status = 'ended';
    } else if (this.releaseDate <= now) {
        this.status = 'now_showing';
    }
    next();
});

// Index for searching
movieSchema.index({ title: 'text', vietnameseTitle: 'text' });

module.exports = mongoose.model('Movie', movieSchema); 