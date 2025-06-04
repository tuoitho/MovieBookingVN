const mongoose = require('mongoose');

// Schema for seats in a showtime
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

// Main showtime schema
const showtimeSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    cinemaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cinema',
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    price: {
        standard: {
            type: Number,
            required: true
        },
        vip: {
            type: Number,
            required: true
        },
        couple: {
            type: Number,
            required: true
        }
    },
    seatsAvailable: {
        type: [[showtimeSeatSchema]],
        required: true
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
showtimeSchema.index({ movieId: 1, startTime: 1 });
showtimeSchema.index({ cinemaId: 1, startTime: 1 });
showtimeSchema.index({ startTime: 1 });

// Virtual for available seats count
showtimeSchema.virtual('availableSeatsCount').get(function() {
    let count = 0;
    this.seatsAvailable.forEach(row => {
        row.forEach(seat => {
            if (seat.status === 'available') count++;
        });
    });
    return count;
});

// Method to check if a seat is available
showtimeSchema.methods.isSeatAvailable = function(row, col) {
    if (!this.seatsAvailable[row] || !this.seatsAvailable[row][col]) {
        return false;
    }
    return this.seatsAvailable[row][col].status === 'available';
};

// Method to get price for a specific seat
showtimeSchema.methods.getSeatPrice = function(row, col) {
    if (!this.seatsAvailable[row] || !this.seatsAvailable[row][col]) {
        return null;
    }
    const seat = this.seatsAvailable[row][col];
    return this.price[seat.type];
};

// Pre-save hook to calculate endTime if not set
showtimeSchema.pre('save', async function(next) {
    if (this.isModified('startTime') || !this.endTime) {
        const Movie = mongoose.model('Movie');
        const movie = await Movie.findById(this.movieId);
        if (movie) {
            this.endTime = new Date(this.startTime.getTime() + movie.duration * 60000);
        }
    }
    next();
});

module.exports = mongoose.model('Showtime', showtimeSchema); 