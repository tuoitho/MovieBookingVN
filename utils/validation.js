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

// Validation functions
const validateReview = (data) => reviewSchema.validate(data);
const validateRegister = (data) => registerSchema.validate(data);
const validateLogin = (data) => loginSchema.validate(data);

module.exports = {
    validateReview,
    validateRegister,
    validateLogin
}; 