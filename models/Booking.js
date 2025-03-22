const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  showtime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime',
    required: [true, 'Booking must belong to a showtime']
  },
  seats: [{
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required']
    },
    price: {
      type: Number,
      required: [true, 'Seat price is required']
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'E-Wallet'],
    required: [true, 'Payment method is required']
  },
  bookingStatus: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'Expired'],
    default: 'Confirmed'
  },
  transactionId: {
    type: String,
    unique: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
bookingSchema.pre('save', function(next) {
  if (this.seats && this.seats.length > 0) {
    this.totalAmount = this.seats.reduce((total, seat) => total + seat.price, 0);
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;