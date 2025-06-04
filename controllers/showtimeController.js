const showtimeService = require('../services/showtimeService');
const catchAsync = require('../utils/catchAsync');

const showtimeController = {
    // Tạo suất chiếu mới (Admin)
    createShowtime: catchAsync(async (req, res) => {
        const showtime = await showtimeService.createShowtime(req.body);
        res.status(201).json({
            status: 'success',
            data: { showtime }
        });
    }),

    // Lấy danh sách suất chiếu
    getShowtimes: catchAsync(async (req, res) => {
        const filters = {
            movieId: req.query.movieId,
            cinemaId: req.query.cinemaId,
            date: req.query.date
        };

        const showtimes = await showtimeService.getShowtimes(filters);
        res.json({
            status: 'success',
            results: showtimes.length,
            data: { showtimes }
        });
    }),

    // Lấy chi tiết suất chiếu
    getShowtime: catchAsync(async (req, res) => {
        const showtime = await showtimeService.getShowtimeById(req.params.id);
        res.json({
            status: 'success',
            data: { showtime }
        });
    }),

    // Cập nhật suất chiếu (Admin)
    updateShowtime: catchAsync(async (req, res) => {
        const showtime = await showtimeService.updateShowtime(req.params.id, req.body);
        res.json({
            status: 'success',
            data: { showtime }
        });
    }),

    // Xóa suất chiếu (Admin)
    deleteShowtime: catchAsync(async (req, res) => {
        await showtimeService.deleteShowtime(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    }),

    // Lấy danh sách suất chiếu theo phim
    getShowtimesByMovie: catchAsync(async (req, res) => {
        const { movieId } = req.params;
        const date = req.query.date || new Date().toISOString().split('T')[0];
        
        const showtimes = await showtimeService.getShowtimesByMovie(movieId, date);
        res.json({
            status: 'success',
            results: showtimes.length,
            data: { showtimes }
        });
    }),

    // Kiểm tra và cập nhật trạng thái ghế
    checkAndUpdateSeats: catchAsync(async (req, res) => {
        const { showtimeId } = req.params;
        const { seats } = req.body;

        const showtime = await showtimeService.checkAndUpdateSeats(showtimeId, seats);
        res.json({
            status: 'success',
            data: { showtime }
        });
    })
};

module.exports = showtimeController; 