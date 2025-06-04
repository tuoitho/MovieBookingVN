const Promotion = require('../models/promotionModel');
const ApiError = require('../utils/ApiError');

class PromotionService {
    // Tạo khuyến mãi mới
    async createPromotion(promotionData) {
        const promotion = await Promotion.create(promotionData);
        return promotion;
    }

    // Cập nhật khuyến mãi
    async updatePromotion(promotionId, updateData) {
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            throw new ApiError(404, 'Không tìm thấy khuyến mãi');
        }

        // Không cho phép cập nhật một số trường nhất định
        delete updateData.timesUsed;
        delete updateData.code; // Không cho phép thay đổi mã

        Object.assign(promotion, updateData);
        await promotion.save();
        return promotion;
    }

    // Xóa khuyến mãi
    async deletePromotion(promotionId) {
        const promotion = await Promotion.findByIdAndDelete(promotionId);
        if (!promotion) {
            throw new ApiError(404, 'Không tìm thấy khuyến mãi');
        }
        return { message: 'Đã xóa khuyến mãi thành công' };
    }

    // Lấy danh sách khuyến mãi (có filter và phân trang)
    async getPromotions(filters = {}, page = 1, limit = 10) {
        try {
            const query = {};

            // Xử lý các filter
            if (filters.isActive === 'true') {
                query.isActive = true;
            } else if (filters.isActive === 'false') {
                query.isActive = false;
            }
            // Nếu không có filter isActive, lấy tất cả

            if (filters.startDate) {
                query.startDate = { $gte: new Date(filters.startDate) };
            }

            if (filters.endDate) {
                query.endDate = { $lte: new Date(filters.endDate) };
            }

            if (filters.discountType) {
                query.discountType = filters.discountType;
            }

            console.log('Query:', JSON.stringify(query));

            // Tính skip cho phân trang
            const skip = (page - 1) * limit;

            // Thực hiện query với filter và phân trang
            const promotions = await Promotion.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            console.log('Found promotions:', promotions.length);

            // Đếm tổng số khuyến mãi thỏa mãn filter
            const total = await Promotion.countDocuments(query);

            return {
                promotions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalPromotions: total
                }
            };
        } catch (error) {
            console.error('Error in getPromotions:', error);
            throw error;
        }
    }

    // Lấy chi tiết một khuyến mãi
    async getPromotion(promotionId) {
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            throw new ApiError(404, 'Không tìm thấy khuyến mãi');
        }
        return promotion;
    }

    // Áp dụng khuyến mãi cho đơn hàng
    async applyPromotion(code, orderValue, movieId = null, showtimeId = null) {
        // Tìm khuyến mãi hợp lệ theo mã
        const promotion = await Promotion.findOne({ code: code });
        console.log(promotion);
        if (!promotion) {
            throw new ApiError(400, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
        }

        // Kiểm tra có áp dụng được cho đơn hàng không
        if (!promotion.isApplicableToOrder(orderValue, movieId, showtimeId)) {
            throw new ApiError(400, 'Mã khuyến mãi không áp dụng được cho đơn hàng này');
        }

        // Tính giá trị giảm giá
        const discountAmount = promotion.calculateDiscount(orderValue);

        return {
            promotion,
            discountAmount,
            finalPrice: orderValue - discountAmount
        };
    }

    // Cập nhật số lần sử dụng của khuyến mãi
    async incrementUsage(promotionId) {
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            throw new ApiError(404, 'Không tìm thấy khuyến mãi');
        }

        promotion.timesUsed += 1;
        await promotion.save();
        return promotion;
    }

    // Kiểm tra khuyến mãi có hợp lệ không
    async validatePromotion(promotionId, orderValue, movieId = null, showtimeId = null) {
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            throw new ApiError(404, 'Không tìm thấy khuyến mãi');
        }

        return promotion.isApplicableToOrder(orderValue, movieId, showtimeId);
    }
}

module.exports = new PromotionService(); 