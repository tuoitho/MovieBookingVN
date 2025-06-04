const Movie = require('../models/movieModel');
const ApiError = require('../utils/ApiError');

class MovieService {
    // Create a new movie
    async createMovie(movieData) {
        try {
            const movie = new Movie(movieData);
            return await movie.save();
        } catch (error) {
            throw new ApiError(400, 'Error creating movie: ' + error.message);
        }
    }

    // Get all movies with filtering and pagination
    async getMovies(filters = {}, page = 1, limit = 10) {
        try {
            const query = {};
            
            // Apply filters
            if (filters.title) {
                query.title = { $regex: filters.title, $options: 'i' };
            }
            if (filters.genre) {
                query.genre = { $in: Array.isArray(filters.genre) ? filters.genre : [filters.genre] };
            }
            if (filters.language) {
                query.language = filters.language;
            }
            if (filters.releaseDate) {
                query.releaseDate = { $gte: new Date(filters.releaseDate) };
            }

            const skip = (page - 1) * limit;
            
            const [movies, total] = await Promise.all([
                Movie.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ releaseDate: -1 }),
                Movie.countDocuments(query)
            ]);

            return {
                movies,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit
                }
            };
        } catch (error) {
            throw new ApiError(500, 'Error fetching movies: ' + error.message);
        }
    }

    // Get movie by ID
    async getMovieById(movieId) {
        try {
            const movie = await Movie.findById(movieId);
            if (!movie) {
                throw new ApiError(404, 'Movie not found');
            }
            return movie;
        } catch (error) {
            throw new ApiError(error.status || 500, error.message);
        }
    }

    // Update movie
    async updateMovie(movieId, updateData) {
        try {
            const movie = await Movie.findByIdAndUpdate(
                movieId,
                { $set: updateData },
                { new: true, runValidators: true }
            );
            
            if (!movie) {
                throw new ApiError(404, 'Movie not found');
            }
            
            return movie;
        } catch (error) {
            throw new ApiError(error.status || 400, 'Error updating movie: ' + error.message);
        }
    }

    // Delete movie
    async deleteMovie(movieId) {
        try {
            const movie = await Movie.findByIdAndDelete(movieId);
            
            if (!movie) {
                throw new ApiError(404, 'Movie not found');
            }
            
            return { message: 'Movie deleted successfully' };
        } catch (error) {
            throw new ApiError(error.status || 500, 'Error deleting movie: ' + error.message);
        }
    }

    // Search movies by title or genre
    async searchMovies(searchTerm) {
        try {
            return await Movie.find({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { genre: { $regex: searchTerm, $options: 'i' } }
                ]
            });
        } catch (error) {
            throw new ApiError(500, 'Error searching movies: ' + error.message);
        }
    }

    // Get upcoming movies
    async getUpcomingMovies() {
        try {
            const today = new Date();
            return await Movie.find({
                releaseDate: { $gt: today }
            }).sort({ releaseDate: 1 });
        } catch (error) {
            throw new ApiError(500, 'Error fetching upcoming movies: ' + error.message);
        }
    }

    // Get now showing movies
    async getNowShowingMovies() {
        try {
            const today = new Date();
            return await Movie.find({
                releaseDate: { $lte: today },
                endDate: { $gte: today }
            });
        } catch (error) {
            throw new ApiError(500, 'Error fetching now showing movies: ' + error.message);
        }
    }
}

module.exports = new MovieService(); 