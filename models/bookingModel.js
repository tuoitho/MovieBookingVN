const mongoose = require('mongoose');
const crypto = require('crypto');

// Schema for booked seats
const bookedSeatSchema = new mongoose.Schema({
    seatNumber: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['standard', 'vip', 'couple'],
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

// Main booking schema
const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    showtimeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true
    },
    seatsBooked: {
        type: [bookedSeatSchema],
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'MoMo', 'ZaloPay', 'Cash_at_counter'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentIntentId: String,
    bookingCode: {
        type: String,
        unique: true
    },
    qrCodeUrl: String,
    notes: String
}, {
    timestamps: true
});

// Indexes for efficient querying
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ showtimeId: 1 });
bookingSchema.index({ bookingCode: 1 });

// Generate unique booking code before saving
bookingSchema.pre('save', function(next) {
    if (!this.bookingCode) {
        // Generate a unique 8-character booking code
        this.bookingCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    next();
});

// Virtual populate for showtime and user details
bookingSchema.virtual('showtime', {
    ref: 'Showtime',
    localField: 'showtimeId',
    foreignField: '_id',
    justOne: true
});

bookingSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    // Example: Allow cancellation only if showtime hasn't started and booking was made within last 24 hours
    const now = new Date();
    const bookingTime = this.createdAt;
    const timeDiff = now - bookingTime;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff <= 24 && this.showtime && this.showtime.startTime > now;
};

// Set toJSON option to include virtuals
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema); 