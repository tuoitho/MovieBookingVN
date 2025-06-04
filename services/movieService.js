const Movie = require('../models/movieModel');
const ApiError = require('../utils/ApiError');

class MovieService {
    // Tạo phim mới
    async createMovie(movieData) {
        const movie = await Movie.create(movieData);
        return movie;
    }

    // Lấy danh sách phim với các tùy chọn lọc và phân trang
    async getMovies(filters = {}, options = {}) {
        const query = {};
        
        // Xử lý các điều kiện lọc
        if (filters.status) {
            query.status = filters.status;
        }
        
        if (filters.genre) {
            query.genre = { $in: Array.isArray(filters.genre) ? filters.genre : [filters.genre] };
        }

        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { vietnameseTitle: { $regex: filters.search, $options: 'i' } }
            ];
        }

        // Xử lý phân trang
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;

        // Thực hiện truy vấn với các điều kiện
        const movies = await Movie.find(query)
            .sort(options.sort || { releaseDate: -1 })
            .skip(skip)
            .limit(limit);

        // Đếm tổng số phim thỏa mãn điều kiện
        const total = await Movie.countDocuments(query);

        return {
            movies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Lấy chi tiết một phim theo ID
    async getMovieById(movieId) {
        const movie = await Movie.findById(movieId);
        if (!movie) {
            throw new ApiError(404, 'Không tìm thấy phim');
        }
        return movie;
    }

    // Lấy chi tiết một phim theo slug
    async getMovieBySlug(slug) {
        const movie = await Movie.findOne({ slug });
        if (!movie) {
            throw new ApiError(404, 'Không tìm thấy phim');
        }
        return movie;
    }

    // Cập nhật thông tin phim
    async updateMovie(movieId, updateData) {
        const movie = await Movie.findByIdAndUpdate(
            movieId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!movie) {
            throw new ApiError(404, 'Không tìm thấy phim');
        }

        return movie;
    }

    // Xóa phim
    async deleteMovie(movieId) {
        const movie = await Movie.findByIdAndDelete(movieId);
        if (!movie) {
            throw new ApiError(404, 'Không tìm thấy phim');
        }
        return movie;
    }

    // Lấy danh sách phim đang chiếu
    async getNowShowingMovies(options = {}) {
        const currentDate = new Date();
        return this.getMovies(
            {
                status: 'now_showing',
                releaseDate: { $lte: currentDate },
                $or: [
                    { endDate: { $gt: currentDate } },
                    { endDate: null }
                ]
            },
            options
        );
    }

    // Lấy danh sách phim sắp chiếu
    async getComingSoonMovies(options = {}) {
        const currentDate = new Date();
        return this.getMovies(
            {
                status: 'coming_soon',
                releaseDate: { $gt: currentDate }
            },
            options
        );
    }

    // Tìm kiếm phim
    async searchMovies(query) {
        if (!query) {
            throw new ApiError(400, 'Vui lòng cung cấp từ khóa tìm kiếm');
        }

        const movies = await Movie.find({
            $text: { $search: query }
        }, {
            score: { $meta: 'textScore' }
        })
        .sort({ score: { $meta: 'textScore' } });

        return movies;
    }

    // Cập nhật đánh giá trung bình của phim
    async updateMovieRating(movieId, newRating) {
        // Validate rating
        if (!Number.isInteger(newRating) || newRating < 1 || newRating > 5) {
            throw new ApiError(400, 'Đánh giá phải là số nguyên từ 1 đến 5');
        }

        const movie = await this.getMovieById(movieId);
        await movie.updateAverageRating(newRating);
        return movie;
    }
}

module.exports = new MovieService(); 