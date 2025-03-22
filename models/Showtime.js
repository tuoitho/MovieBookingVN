const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie reference is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  theater: {
    name: {
      type: String,
      required: [true, 'Theater name is required']
    },
    screen: {
      type: String,
      required: [true, 'Screen number is required']
    }
  },
  ticketPrice: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: 0
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats count is required'],
    min: 0
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats count is required'],
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Almost Full', 'Full', 'Cancelled'],
    default: 'Available'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to calculate remaining seats
showtimeSchema.virtual('remainingSeats').get(function() {
  return this.availableSeats;
});

// Update showtime status based on available seats
showtimeSchema.pre('save', function(next) {
  const availabilityPercentage = (this.availableSeats / this.totalSeats) * 100;
  
  if (this.availableSeats === 0) {
    this.status = 'Full';
  } else if (availabilityPercentage <= 20) {
    this.status = 'Almost Full';
  } else {
    this.status = 'Available';
  }
  
  next();
});

const Showtime = mongoose.model('Showtime', showtimeSchema);
module.exports = Showtime;