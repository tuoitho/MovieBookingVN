const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please provide promotion code'],
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide promotion description']
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        validate: {
            validator: function(value) {
                if (this.discountType === 'percentage') {
                    return value > 0 && value <= 100;
                }
                return value > 0;
            },
            message: props => `${props.value} is not a valid discount value!`
        }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date!'
        }
    },
    usageLimit: {
        type: Number,
        min: 0
    },
    timesUsed: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    minOrderValue: {
        type: Number,
        min: 0
    },
    applicableMovies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
    }],
    applicableShowtimes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime'
    }]
}, {
    timestamps: true
});

// Indexes for efficient querying
promotionSchema.index({ code: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ isActive: 1 });

// Method to check if promotion is valid
promotionSchema.methods.isValid = function(orderValue, movieId, showtimeId) {
    const now = new Date();
    
    // Check basic validity
    if (!this.isActive || now < this.startDate || now > this.endDate) {
        return false;
    }

    // Check usage limit
    if (this.usageLimit && this.timesUsed >= this.usageLimit) {
        return false;
    }

    // Check minimum order value
    if (this.minOrderValue && orderValue < this.minOrderValue) {
        return false;
    }

    // Check if applicable for specific movies
    if (this.applicableMovies && this.applicableMovies.length > 0) {
        if (!movieId || !this.applicableMovies.includes(movieId)) {
            return false;
        }
    }

    // Check if applicable for specific showtimes
    if (this.applicableShowtimes && this.applicableShowtimes.length > 0) {
        if (!showtimeId || !this.applicableShowtimes.includes(showtimeId)) {
            return false;
        }
    }

    return true;
};

// Method to calculate discount amount
promotionSchema.methods.calculateDiscount = function(orderValue) {
    if (this.discountType === 'percentage') {
        return (orderValue * this.discountValue) / 100;
    }
    return Math.min(this.discountValue, orderValue); // For fixed amount
};

// Pre-save middleware to validate dates
promotionSchema.pre('save', function(next) {
    const now = new Date();
    if (this.endDate < now) {
        this.isActive = false;
    }
    next();
});

module.exports = mongoose.model('Promotion', promotionSchema); 