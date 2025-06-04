const promotionService = require('../services/promotionService');
const catchAsync = require('../utils/catchAsync');
const { validatePromotion } = require('../utils/validation');

const promotionController = {
    // [POST] /api/v1/promotions
    createPromotion: catchAsync(async (req, res) => {
        const { error } = validatePromotion(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }

        const promotion = await promotionService.createPromotion(req.body);

        res.status(201).json({
            status: 'success',
            data: promotion
        });
    }),

    // [PUT] /api/v1/promotions/:id
    updatePromotion: catchAsync(async (req, res) => {
        const { error } = validatePromotion(req.body, true); // true for update validation
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }

        const promotion = await promotionService.updatePromotion(
            req.params.id,
            req.body
        );

        res.json({
            status: 'success',
            data: promotion
        });
    }),

    // [DELETE] /api/v1/promotions/:id
    deletePromotion: catchAsync(async (req, res) => {
        const result = await promotionService.deletePromotion(req.params.id);

        res.json({
            status: 'success',
            result 
        });
    }),

    // [GET] /api/v1/promotions
    getPromotions: catchAsync(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            isActive: req.query.isActive === 'true',
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            discountType: req.query.discountType
        };

        const result = await promotionService.getPromotions(filters, page, limit);
        

        res.json({
            status: 'success',
            data: result
        });
    }),

    // [GET] /api/v1/promotions/:id
    getPromotion: catchAsync(async (req, res) => {
        const promotion = await promotionService.getPromotion(req.params.id);

        res.json({
            status: 'success',
            data: promotion
        });
    }),

    // [POST] /api/v1/promotions/apply
    applyPromotion: catchAsync(async (req, res) => {
        const { code, orderValue, movieId, showtimeId } = req.body;

        if (!code || !orderValue) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng cung cấp mã khuyến mãi và giá trị đơn hàng'
            });
        }

        const result = await promotionService.applyPromotion(
            code,
            orderValue,
            movieId,
            showtimeId
        );

        res.json({
            status: 'success',
            data: result
        });
    }),

    // [POST] /api/v1/promotions/:id/increment-usage
    incrementUsage: catchAsync(async (req, res) => {
        const promotion = await promotionService.incrementUsage(req.params.id);

        res.json({
            status: 'success',
            data: promotion
        });
    }),

    // [POST] /api/v1/promotions/:id/validate
    validatePromotion: catchAsync(async (req, res) => {
        const { orderValue, movieId, showtimeId } = req.body;

        if (!orderValue) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng cung cấp giá trị đơn hàng'
            });
        }

        const isValid = await promotionService.validatePromotion(
            req.params.id,
            orderValue,
            movieId,
            showtimeId
        );

        res.json({
            status: 'success',
            data: { isValid }
        });
    })
};

module.exports = promotionController; 