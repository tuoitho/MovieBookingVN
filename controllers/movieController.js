const movieService = require('../services/movieService');
const catchAsync = require('../utils/catchAsync');

const movieController = {
    // Create a new movie
    createMovie: catchAsync(async (req, res) => {
        const movie = await movieService.createMovie(req.body);
        res.status(201).json({
            status: 'success',
            data: { movie }
        });
    }),

    // Get all movies with filters and pagination
    getMovies: catchAsync(async (req, res) => {
        const { page = 1, limit = 10, ...filters } = req.query;
        const result = await movieService.getMovies(filters, parseInt(page), parseInt(limit));
        res.status(200).json({
            status: 'success',
            data: result
        });
    }),

    // Get a single movie by ID
    getMovie: catchAsync(async (req, res) => {
        const movie = await movieService.getMovieById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: { movie }
        });
    }),

    // Update a movie
    updateMovie: catchAsync(async (req, res) => {
        const movie = await movieService.updateMovie(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: { movie }
        });
    }),

    // Delete a movie
    deleteMovie: catchAsync(async (req, res) => {
        const result = await movieService.deleteMovie(req.params.id);
        res.status(200).json({
            status: 'success',
            data: result
        });
    }),

    // Search movies
    searchMovies: catchAsync(async (req, res) => {
        const { query } = req.query;
        const movies = await movieService.searchMovies(query);
        res.status(200).json({
            status: 'success',
            data: { movies }
        });
    }),

    // Get upcoming movies
    getUpcomingMovies: catchAsync(async (req, res) => {
        const movies = await movieService.getUpcomingMovies();
        res.status(200).json({
            status: 'success',
            data: { movies }
        });
    }),

    // Get now showing movies
    getNowShowingMovies: catchAsync(async (req, res) => {
        const movies = await movieService.getNowShowingMovies();
        res.status(200).json({
            status: 'success',
            data: { movies }
        });
    })
};

module.exports = movieController; 