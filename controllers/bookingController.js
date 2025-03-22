const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user')
      .populate({
        path: 'showtime',
        populate: { path: 'movie' }
      });

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'showtime',
        populate: { path: 'movie' }
      });

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    // Check if showtime exists and has available seats
    const showtime = await Showtime.findById(req.body.showtime);
    if (!showtime) {
      return res.status(404).json({
        status: 'fail',
        message: 'Showtime not found'
      });
    }

    if (showtime.availableSeats < req.body.seats.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'Not enough available seats'
      });
    }

    // Create booking
    const booking = await Booking.create({
      ...req.body,
      user: req.user.id
    });

    // Update showtime available seats
    showtime.availableSeats -= req.body.seats.length;
    await showtime.save();

    res.status(201).json({
      status: 'success',
      data: { booking }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: req.body.status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus: req.body.status,
        transactionId: req.body.transactionId
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};