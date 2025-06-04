const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Vui lòng nhập mã khuyến mãi'],
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Vui lòng nhập mô tả khuyến mãi']
    },
    discountType: {
        type: String,
        enum: {
            values: ['percentage', 'fixed_amount'],
            message: 'Loại giảm giá phải là percentage hoặc fixed_amount'
        },
        required: [true, 'Vui lòng chọn loại giảm giá']
    },
    discountValue: {
        type: Number,
        required: [true, 'Vui lòng nhập giá trị giảm giá'],
        validate: {
            validator: function(value) {
                if (this.discountType === 'percentage') {
                    return value > 0 && value <= 100;
                }
                return value > 0;
            },
            message: props => {
                if (props.value <= 0) return 'Giá trị giảm giá phải lớn hơn 0';
                return 'Phần trăm giảm giá phải từ 1-100%';
            }
        }
    },
    startDate: {
        type: Date,
        required: [true, 'Vui lòng nhập ngày bắt đầu']
    },
    endDate: {
        type: Date,
        required: [true, 'Vui lòng nhập ngày kết thúc'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'Ngày kết thúc phải sau ngày bắt đầu'
        }
    },
    usageLimit: {
        type: Number,
        min: [1, 'Số lần sử dụng tối đa phải lớn hơn 0']
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
        min: [0, 'Giá trị đơn hàng tối thiểu không được âm']
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ discountType: 1, isActive: 1 });

// Virtual field để kiểm tra khuyến mãi còn hiệu lực không
promotionSchema.virtual('isValid').get(function() {
    const now = new Date();
    return (
        this.isActive &&
        now >= this.startDate &&
        now <= this.endDate &&
        (!this.usageLimit || this.timesUsed < this.usageLimit)
    );
});

// Middleware để tự động set isActive = false khi hết hạn hoặc hết lượt sử dụng
promotionSchema.pre('save', function(next) {
    if (
        this.endDate < new Date() ||
        (this.usageLimit && this.timesUsed >= this.usageLimit)
    ) {
        this.isActive = false;
    }
    next();
});

// Instance method để kiểm tra có áp dụng được cho đơn hàng không
promotionSchema.methods.isApplicableToOrder = function(orderValue, movieId, showtimeId) {
    // Kiểm tra có còn hiệu lực không
    if (!this.isValid) return false;

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (this.minOrderValue && orderValue < this.minOrderValue) return false;

    // Kiểm tra phim áp dụng
    if (this.applicableMovies && this.applicableMovies.length > 0) {
        if (!movieId || !this.applicableMovies.includes(movieId)) return false;
    }

    // Kiểm tra suất chiếu áp dụng
    if (this.applicableShowtimes && this.applicableShowtimes.length > 0) {
        if (!showtimeId || !this.applicableShowtimes.includes(showtimeId)) return false;
    }

    return true;
};

// Instance method để tính giá trị giảm giá
promotionSchema.methods.calculateDiscount = function(orderValue) {
    if (this.discountType === 'percentage') {
        return (orderValue * this.discountValue) / 100;
    }
    return Math.min(this.discountValue, orderValue); // Không giảm nhiều hơn giá trị đơn hàng
};

// Static method để tìm khuyến mãi hợp lệ theo mã
promotionSchema.statics.findValidByCode = async function(code) {
    return this.findOne({
        code: code.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $or: [
            { usageLimit: { $exists: false } },
            { $expr: { $lt: ['$timesUsed', '$usageLimit'] } }
        ]
    });
};

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion; 