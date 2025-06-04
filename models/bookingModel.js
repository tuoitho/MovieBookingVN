const mongoose = require('mongoose');
const crypto = require('crypto');

// Schema cho từng ghế trong booking
const bookingSeatSchema = new mongoose.Schema({
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

// Schema cho booking
const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Booking phải có user']
    },
    showtimeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: [true, 'Booking phải có suất chiếu']
    },
    seats: {
        type: [bookingSeatSchema],
        required: [true, 'Booking phải có ít nhất 1 ghế'],
        validate: {
            validator: function(seats) {
                return seats.length > 0;
            },
            message: 'Booking phải có ít nhất 1 ghế'
        }
    },
    totalAmount: {
        type: Number,
        required: true
    },
    promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion'
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'paid', 'cancelled', 'expired'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['vnpay', 'momo', 'zalopay'],
        required: [true, 'Vui lòng chọn phương thức thanh toán']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDetails: {
        transactionId: String,
        paymentTime: Date,
        rawResponse: Object
    },
    bookingCode: {
        type: String,
        unique: true
    },
    expiredAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index cho tìm kiếm booking
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ showtimeId: 1, status: 1 });

// Tự động tạo mã booking
bookingSchema.pre('save', async function(next) {
    if (this.isNew) {
        // Format: BK-YYYYMMDD-XXXX (X là số ngẫu nhiên)
        const date = new Date();
        const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000); // 4 chữ số
        this.bookingCode = `BK-${dateStr}-${random}`;
        
        // Set thời gian hết hạn (15 phút từ khi tạo)
        this.expiredAt = new Date(date.getTime() + 15 * 60000);
    }
    next();
});

// Middleware để tự động tính finalAmount
bookingSchema.pre('save', function(next) {
    if (this.isModified('totalAmount') || this.isModified('discountAmount')) {
        this.finalAmount = this.totalAmount - this.discountAmount;
    }
    next();
});

// Phương thức để kiểm tra trạng thái booking
bookingSchema.methods.isExpired = function() {
    return this.status === 'expired' || new Date() > this.expiredAt;
};

bookingSchema.methods.canCancel = function() {
    return ['pending', 'confirmed'].includes(this.status);
};

// Phương thức để cập nhật trạng thái thanh toán
bookingSchema.methods.updatePaymentStatus = async function(status, details) {
    this.paymentStatus = status;
    if (details) {
        this.paymentDetails = {
            ...this.paymentDetails,
            ...details
        };
    }
    
    // Nếu thanh toán thành công, cập nhật trạng thái booking
    if (status === 'completed') {
        this.status = 'paid';
        this.paymentDetails.paymentTime = new Date();
    } else if (status === 'failed') {
        this.status = 'cancelled';
    }
    
    return this.save();
};

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

// Set toJSON option to include virtuals
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema); 