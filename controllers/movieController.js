const movieService = require('../services/movieService');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

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
        const filters = {
            status: req.query.status,
            genre: req.query.genre,
            search: req.query.search
        };

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort
        };

        const result = await movieService.getMovies(filters, options);
        res.json(result);
    }),

    // Get a single movie by ID
    getMovie: catchAsync(async (req, res) => {
        const movie = await movieService.getMovieById(req.params.id);
        res.json(movie);
    }),

    // Get a single movie by slug
    getMovieBySlug: catchAsync(async (req, res) => {
        const movie = await movieService.getMovieBySlug(req.params.slug);
        res.json(movie);
    }),

    // Update a movie
    updateMovie: catchAsync(async (req, res) => {
        const movie = await movieService.updateMovie(req.params.id, req.body);
        res.json(movie);
    }),

    // Delete a movie
    deleteMovie: catchAsync(async (req, res) => {
        await movieService.deleteMovie(req.params.id);
        res.status(204).json(null);
    }),

    // Search movies
    searchMovies: catchAsync(async (req, res) => {
        const { query } = req.query;
        const movies = await movieService.searchMovies(query);
        res.status(200).json({
            status: 'success',
            results: movies.length,
            data: { movies }
        });
    }),

    // Get now showing movies
    getNowShowingMovies: catchAsync(async (req, res) => {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort
        };
        
        const result = await movieService.getNowShowingMovies(options);
        res.json(result);
    }),

    // Get coming soon movies
    getComingSoonMovies: catchAsync(async (req, res) => {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort
        };
        
        const result = await movieService.getComingSoonMovies(options);
        res.json(result);
    })
};

module.exports = movieController; 