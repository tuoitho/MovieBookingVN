const mongoose = require('mongoose');
const slugify = require('slugify');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Vui lòng nhập tên phim'],
        unique: false
    },
    vietnameseTitle: {
        type: String,
        required: [true, 'Vui lòng nhập tên phim tiếng Việt']
    },
    description: {
        type: String,
        required: [true, 'Vui lòng nhập mô tả phim']
    },
    posterUrl: {
        type: String,
        required: [true, 'Vui lòng cung cấp URL poster phim']
    },
    bannerUrl: {
        type: String
    },
    trailerUrl: {
        type: String,
        required: [true, 'Vui lòng cung cấp URL trailer phim']
    },
    duration: {
        type: Number,
        required: [true, 'Vui lòng nhập thời lượng phim']
    },
    releaseDate: {
        type: Date,
        required: [true, 'Vui lòng nhập ngày khởi chiếu']
    },
    endDate: {
        type: Date
    },
    genre: {
        type: [String],
        required: [true, 'Vui lòng chọn ít nhất một thể loại']
    },
    director: String,
    actors: [String],
    language: {
        type: String,
        required: [true, 'Vui lòng nhập ngôn ngữ phim']
    },
    rating: {
        type: String,
        enum: ['P', 'C13', 'C16', 'C18'],
        default: 'P'
    },
    status: {
        type: String,
        enum: ['now_showing', 'coming_soon', 'ended'],
        default: 'coming_soon'
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
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

// Tạo slug trước khi lưu
movieSchema.pre('save', function(next) {
    if (!this.isModified('title')) {
        return next();
    }
    this.slug = slugify(this.title, {
        lower: true,
        strict: true,
        locale: 'vi'
    });
    next();
});

// Phương thức tĩnh để kiểm tra xem phim có đang chiếu không
movieSchema.statics.isNowShowing = function(movieId) {
    return this.findOne({
        _id: movieId,
        status: 'now_showing',
        releaseDate: { $lte: new Date() },
        $or: [
            { endDate: { $gt: new Date() } },
            { endDate: null }
        ]
    });
};

// Phương thức instance để cập nhật rating trung bình
movieSchema.methods.updateAverageRating = async function(newRating) {
    const currentTotal = this.averageRating * this.totalReviews;
    this.totalReviews += 1;
    this.averageRating = (currentTotal + newRating) / this.totalReviews;
    await this.save();
};

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