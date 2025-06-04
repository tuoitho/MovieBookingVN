const mongoose = require('mongoose');

// Schema cho một ghế trong phòng chiếu
const seatSchema = new mongoose.Schema({
    seatNumber: {
        type: String,
        required: [true, 'Vui lòng nhập số ghế']
    },
    type: {
        type: String,
        enum: ['standard', 'vip', 'couple'],
        default: 'standard'
    },
    isBooked: {
        type: Boolean,
        default: false
    }
});

// Schema cho một phòng chiếu
const roomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: [true, 'Vui lòng nhập tên phòng chiếu']
    },
    seatLayout: {
        type: [[seatSchema]],
        required: [true, 'Vui lòng cung cấp sơ đồ ghế']
    },
    capacity: {
        type: Number,
        required: [true, 'Vui lòng nhập sức chứa của phòng']
    }
});

// Schema chính cho rạp chiếu phim
const cinemaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên rạp'],
        unique: true
    },
    address: {
        type: String,
        required: [true, 'Vui lòng nhập địa chỉ rạp']
    },
    city: {
        type: String,
        required: [true, 'Vui lòng nhập thành phố']
    },
    logoUrl: {
        type: String
    },
    rooms: [roomSchema]
}, {
    timestamps: true
});

// Index cho tìm kiếm theo thành phố
cinemaSchema.index({ city: 1 });

// Phương thức tĩnh để kiểm tra xem phòng có tồn tại không
cinemaSchema.statics.findRoom = function(cinemaId, roomId) {
    return this.findOne({
        _id: cinemaId,
        'rooms._id': roomId
    }, {
        'rooms.$': 1
    });
};

// Phương thức instance để thêm phòng mới
cinemaSchema.methods.addRoom = function(roomData) {
    this.rooms.push(roomData);
    return this.save();
};

module.exports = mongoose.model('Cinema', cinemaSchema); 