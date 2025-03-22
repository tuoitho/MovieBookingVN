const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Movie description is required']
  },
  duration: {
    type: Number,
    required: [true, 'Movie duration is required']
  },
  genre: [{
    type: String,
    required: [true, 'Movie genre is required']
  }],
  language: {
    type: String,
    required: [true, 'Movie language is required']
  },
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required']
  },
  director: {
    type: String,
    required: [true, 'Director name is required']
  },
  cast: [{
    type: String,
    required: [true, 'Cast members are required']
  }],
  posterUrl: {
    type: String,
    required: [true, 'Movie poster URL is required']
  },
  trailerUrl: {
    type: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  status: {
    type: String,
    enum: ['Coming Soon', 'Now Showing', 'Ended'],
    default: 'Coming Soon'
  }
}, {
  timestamps: true
});

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;