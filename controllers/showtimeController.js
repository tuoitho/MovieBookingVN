const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');

// Get all showtimes
exports.getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find().populate('movie');
    res.status(200).json({
      status: 'success',
      results: showtimes.length,
      data: { showtimes }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get showtime by ID
exports.getShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate('movie');
    if (!showtime) {
      return res.status(404).json({
        status: 'fail',
        message: 'Showtime not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { showtime }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Create new showtime
exports.createShowtime = async (req, res) => {
  try {
    // Check if movie exists
    const movie = await Movie.findById(req.body.movie);
    if (!movie) {
      return res.status(404).json({
        status: 'fail',
        message: 'Movie not found'
      });
    }

    const newShowtime = await Showtime.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { showtime: newShowtime }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update showtime
exports.updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('movie');

    if (!showtime) {
      return res.status(404).json({
        status: 'fail',
        message: 'Showtime not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { showtime }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete showtime
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    if (!showtime) {
      return res.status(404).json({
        status: 'fail',
        message: 'Showtime not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get showtimes by movie
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movie: req.params.movieId }).populate('movie');
    res.status(200).json({
      status: 'success',
      results: showtimes.length,
      data: { showtimes }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get available showtimes
exports.getAvailableShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ status: 'Available' }).populate('movie');
    res.status(200).json({
      status: 'success',
      results: showtimes.length,
      data: { showtimes }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};