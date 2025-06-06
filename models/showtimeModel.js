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
        enum: ['available', 'booked', 'unavailable'],
        default: 'available'
    },
    price: {
        type: Number,
        required: true
    },
    selectedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userInfo: {
            name: String,
            email: String
        },
        selectedAt: {
            type: Date,
            default: Date.now
        }
    }]
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
        default: null
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
showtimeSchema.statics.checkOverlap = async function(cinemaId, roomId, startTime, excludeId = null) {
    // Kiểm tra các điều kiện đầu vào
    if (!cinemaId || !roomId || !startTime) {
        throw new Error('Thiếu thông tin để kiểm tra trùng lịch');
    }

    // Tạo query để tìm suất chiếu trùng lịch
    const query = {
        cinemaId,
        roomId,
        // Kiểm tra xem startTime có nằm trong khoảng thời gian của suất chiếu nào không
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
    };

    // Nếu đang cập nhật suất chiếu hiện có, loại trừ nó khỏi việc kiểm tra
    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const overlapping = await this.findOne(query)
        .populate('movieId', 'title duration')
        .populate('cinemaId', 'name');

    // Nếu tìm thấy suất chiếu trùng, trả về thông tin chi tiết
    if (overlapping) {
        return {
            hasOverlap: true,
            overlappingShowtime: {
                movie: overlapping.movieId.title,
                duration: overlapping.movieId.duration,
                cinema: overlapping.cinemaId.name,
                startTime: overlapping.startTime,
                endTime: overlapping.endTime
            }
        };
    }

    return null;
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