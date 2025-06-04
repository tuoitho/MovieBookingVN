const mongoose = require('mongoose');

// Schema cho trạng thái ghế trong suất chiếu
const showtimeSeatSchema = new mongoose.Schema({
    seatNumber: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['standard', 'vip', 'couple'],
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'unavailable', 'selected'],
        default: 'available'
    },
    price: {
        type: Number,
        required: true
    }
});

// Schema chính cho suất chiếu
const showtimeSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: [true, 'Vui lòng chọn phim']
    },
    cinemaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cinema',
        required: [true, 'Vui lòng chọn rạp']
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Vui lòng chọn phòng chiếu']
    },
    startTime: {
        type: Date,
        required: [true, 'Vui lòng chọn thời gian bắt đầu']
    },
    endTime: {
        type: Date,
        required: [true, 'Vui lòng chọn thời gian kết thúc']
    },
    price: {
        standard: {
            type: Number,
            required: [true, 'Vui lòng nhập giá vé ghế thường']
        },
        vip: {
            type: Number,
            required: [true, 'Vui lòng nhập giá vé ghế VIP']
        },
        couple: {
            type: Number,
            required: [true, 'Vui lòng nhập giá vé ghế đôi']
        }
    },
    seatsAvailable: {
        type: [[showtimeSeatSchema]],
        required: [true, 'Vui lòng cung cấp sơ đồ ghế']
    }
}, {
    timestamps: true
});

// Index cho tìm kiếm suất chiếu
showtimeSchema.index({ movieId: 1, startTime: 1 });
showtimeSchema.index({ cinemaId: 1, startTime: 1 });

// Middleware để tự động tính endTime dựa trên startTime và độ dài phim
showtimeSchema.pre('save', async function(next) {
    if (this.isModified('startTime') || !this.endTime) {
        const Movie = mongoose.model('Movie');
        const movie = await Movie.findById(this.movieId);
        if (!movie) {
            throw new Error('Không tìm thấy phim');
        }
        // Tính endTime = startTime + độ dài phim (phút)
        this.endTime = new Date(this.startTime.getTime() + movie.duration * 60000);
    }
    next();
});

// Phương thức để kiểm tra xem suất chiếu có bị trùng không
showtimeSchema.statics.checkOverlap = async function(cinemaId, roomId, startTime, endTime, excludeId = null) {
    const query = {
        cinemaId,
        roomId,
        $or: [
            {
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }
        ]
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const overlapping = await this.findOne(query);
    return overlapping;
};

// Phương thức để cập nhật trạng thái ghế
showtimeSchema.methods.updateSeatStatus = async function(seatNumber, status) {
    for (let i = 0; i < this.seatsAvailable.length; i++) {
        for (let j = 0; j < this.seatsAvailable[i].length; j++) {
            if (this.seatsAvailable[i][j].seatNumber === seatNumber) {
                this.seatsAvailable[i][j].status = status;
                break;
            }
        }
    }
    return this.save();
};

module.exports = mongoose.model('Showtime', showtimeSchema); 