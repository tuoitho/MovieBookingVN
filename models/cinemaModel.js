const mongoose = require('mongoose');

// Schema for individual seats
const seatSchema = new mongoose.Schema({
    seatNumber: {
        type: String,
        required: true
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

// Schema for rooms within a cinema
const roomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    seatLayout: {
        type: [[seatSchema]],
        required: true
    },
    capacity: {
        type: Number,
        required: true
    }
});

// Main cinema schema
const cinemaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide cinema name'],
        unique: true,
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please provide cinema address']
    },
    city: {
        type: String,
        required: [true, 'Please provide city']
    },
    logoUrl: {
        type: String
    },
    rooms: [roomSchema]
}, {
    timestamps: true
});

// Index for searching and filtering
cinemaSchema.index({ city: 1 });
cinemaSchema.index({ name: 'text' });

// Virtual for total capacity
cinemaSchema.virtual('totalCapacity').get(function() {
    return this.rooms.reduce((total, room) => total + room.capacity, 0);
});

// Method to check if a room exists
cinemaSchema.methods.hasRoom = function(roomId) {
    return this.rooms.some(room => room._id.toString() === roomId);
};

// Method to get a specific room
cinemaSchema.methods.getRoom = function(roomId) {
    return this.rooms.find(room => room._id.toString() === roomId);
};

module.exports = mongoose.model('Cinema', cinemaSchema); 