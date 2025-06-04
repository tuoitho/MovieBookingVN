const Joi = require('joi');

// Review validation
const reviewSchema = Joi.object({
    rating: Joi.number()
        .required()
        .min(1)
        .max(5)
        .messages({
            'number.base': 'Điểm đánh giá phải là số',
            'number.empty': 'Vui lòng nhập điểm đánh giá',
            'number.min': 'Điểm đánh giá phải từ 1 đến 5',
            'number.max': 'Điểm đánh giá phải từ 1 đến 5',
            'any.required': 'Vui lòng nhập điểm đánh giá'
        }),
    comment: Joi.string()
        .trim()
        .allow('')
        .max(1000)
        .messages({
            'string.max': 'Nội dung đánh giá không được vượt quá 1000 ký tự'
        })
});

// Auth validation
const registerSchema = Joi.object({
    fullName: Joi.string()
        .required()
        .min(2)
        .max(50)
        .messages({
            'string.empty': 'Vui lòng nhập họ tên',
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được vượt quá 50 ký tự',
            'any.required': 'Vui lòng nhập họ tên'
        }),
    email: Joi.string()
        .required()
        .email()
        .messages({
            'string.empty': 'Vui lòng nhập email',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Vui lòng nhập email'
        }),
    password: Joi.string()
        .required()
        .min(6)
        .messages({
            'string.empty': 'Vui lòng nhập mật khẩu',
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Vui lòng nhập mật khẩu'
        }),
    phoneNumber: Joi.string()
        .pattern(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/)
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ'
        })
        .allow(''),
    avatar: Joi.string().uri().allow('')
});

const loginSchema = Joi.object({
    email: Joi.string()
        .required()
        .email()
        .messages({
            'string.empty': 'Vui lòng nhập email',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Vui lòng nhập email'
        }),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Vui lòng nhập mật khẩu',
            'any.required': 'Vui lòng nhập mật khẩu'
        })
});

// Promotion validation
const promotionSchema = Joi.object({
    code: Joi.string()
        .required()
        .uppercase()
        .pattern(/^[A-Z0-9]{3,20}$/)
        .messages({
            'string.empty': 'Vui lòng nhập mã khuyến mãi',
            'string.pattern.base': 'Mã khuyến mãi chỉ được chứa chữ cái và số, độ dài 3-20 ký tự',
            'any.required': 'Vui lòng nhập mã khuyến mãi'
        }),
    description: Joi.string()
        .required()
        .min(10)
        .max(500)
        .messages({
            'string.empty': 'Vui lòng nhập mô tả khuyến mãi',
            'string.min': 'Mô tả phải có ít nhất 10 ký tự',
            'string.max': 'Mô tả không được vượt quá 500 ký tự',
            'any.required': 'Vui lòng nhập mô tả khuyến mãi'
        }),
    discountType: Joi.string()
        .required()
        .valid('percentage', 'fixed_amount')
        .messages({
            'any.only': 'Loại giảm giá phải là percentage hoặc fixed_amount',
            'any.required': 'Vui lòng chọn loại giảm giá'
        }),
    discountValue: Joi.number()
        .required()
        .positive()
        .when('discountType', {
            is: 'percentage',
            then: Joi.number().max(100)
        })
        .messages({
            'number.base': 'Giá trị giảm giá phải là số',
            'number.positive': 'Giá trị giảm giá phải lớn hơn 0',
            'number.max': 'Phần trăm giảm giá không được vượt quá 100%',
            'any.required': 'Vui lòng nhập giá trị giảm giá'
        }),
    startDate: Joi.date()
        .required()
        .min('now')
        .messages({
            'date.base': 'Ngày bắt đầu không hợp lệ',
            'date.min': 'Ngày bắt đầu phải từ hiện tại trở đi',
            'any.required': 'Vui lòng nhập ngày bắt đầu'
        }),
    endDate: Joi.date()
        .required()
        .min(Joi.ref('startDate'))
        .messages({
            'date.base': 'Ngày kết thúc không hợp lệ',
            'date.min': 'Ngày kết thúc phải sau ngày bắt đầu',
            'any.required': 'Vui lòng nhập ngày kết thúc'
        }),
    usageLimit: Joi.number()
        .integer()
        .min(1)
        .messages({
            'number.base': 'Số lần sử dụng phải là số nguyên',
            'number.integer': 'Số lần sử dụng phải là số nguyên',
            'number.min': 'Số lần sử dụng phải lớn hơn 0'
        })
        .allow(null),
    minOrderValue: Joi.number()
        .min(0)
        .messages({
            'number.base': 'Giá trị đơn hàng tối thiểu phải là số',
            'number.min': 'Giá trị đơn hàng tối thiểu không được âm'
        })
        .allow(null),
    applicableMovies: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .messages({
            'array.base': 'Danh sách phim áp dụng phải là mảng',
            'string.pattern.base': 'ID phim không hợp lệ'
        })
        .allow(null),
    applicableShowtimes: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
        .messages({
            'array.base': 'Danh sách suất chiếu áp dụng phải là mảng',
            'string.pattern.base': 'ID suất chiếu không hợp lệ'
        })
        .allow(null)
}).options({ stripUnknown: true });

// Validation functions
const validateReview = (data) => reviewSchema.validate(data);
const validateRegister = (data) => registerSchema.validate(data);
const validateLogin = (data) => loginSchema.validate(data);
const validatePromotion = (data, isUpdate = false) => {
    // Khi cập nhật, không bắt buộc các trường
    if (isUpdate) {
        return promotionSchema.fork(
            ['code', 'description', 'discountType', 'discountValue', 'startDate', 'endDate'],
            (schema) => schema.optional()
        ).validate(data);
    }
    return promotionSchema.validate(data);
};

module.exports = {
    validateReview,
    validateRegister,
    validateLogin,
    validatePromotion
}; 