const cinemaService = require('../services/cinemaService');
const catchAsync = require('../utils/catchAsync');

const cinemaController = {
    // Tạo rạp mới (Admin)
    createCinema: catchAsync(async (req, res) => {
        const cinema = await cinemaService.createCinema(req.body);
        res.status(201).json({
            status: 'success',
            data: { cinema }
        });
    }),

    // Lấy danh sách rạp
    getCinemas: catchAsync(async (req, res) => {
        const filters = {
            city: req.query.city,
            search: req.query.search
        };

        const cinemas = await cinemaService.getCinemas(filters);
        res.json({
            status: 'success',
            results: cinemas.length,
            data: { cinemas }
        });
    }),

    // Lấy chi tiết một rạp
    getCinema: catchAsync(async (req, res) => {
        const cinema = await cinemaService.getCinemaById(req.params.id);
        res.json({
            status: 'success',
            data: { cinema }
        });
    }),

    // Cập nhật thông tin rạp (Admin)
    updateCinema: catchAsync(async (req, res) => {
        const cinema = await cinemaService.updateCinema(req.params.id, req.body);
        res.json({
            status: 'success',
            data: { cinema }
        });
    }),

    // Xóa rạp (Admin)
    deleteCinema: catchAsync(async (req, res) => {
        await cinemaService.deleteCinema(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    }),

    // Thêm phòng mới vào rạp (Admin)
    addRoom: catchAsync(async (req, res) => {
        const cinema = await cinemaService.addRoom(req.params.cinemaId, req.body);
        res.status(201).json({
            status: 'success',
            data: { cinema }
        });
    }),

    // Cập nhật thông tin phòng (Admin)
    updateRoom: catchAsync(async (req, res) => {
        const cinema = await cinemaService.updateRoom(
            req.params.cinemaId,
            req.params.roomId,
            req.body
        );
        res.json({
            status: 'success',
            data: { cinema }
        });
    }),

    // Xóa phòng (Admin)
    deleteRoom: catchAsync(async (req, res) => {
        const cinema = await cinemaService.deleteRoom(
            req.params.cinemaId,
            req.params.roomId
        );
        res.json({
            status: 'success',
            data: { cinema }
        });
    }),

    // Lấy thông tin một phòng cụ thể
    getRoom: catchAsync(async (req, res) => {
        const room = await cinemaService.getRoom(
            req.params.cinemaId,
            req.params.roomId
        );
        res.json({
            status: 'success',
            data: { room }
        });
    })
};

module.exports = cinemaController; 