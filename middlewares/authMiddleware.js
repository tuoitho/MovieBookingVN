const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// Protect routes - Authentication check
const protect = catchAsync(async (req, res, next) => {
    try {
        // 1) Get token and check if it exists
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new ApiError(401, 'Vui lòng đăng nhập để truy cập');
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new ApiError(401, 'Người dùng không tồn tại, vui lòng đăng nhập lại');
        }

        // 4) Check if user changed password after the token was issued
        if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
            throw new ApiError(401, 'Mật khẩu đã được thay đổi, vui lòng đăng nhập lại');
        }

        // Grant access to protected route
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Token không hợp lệ, vui lòng đăng nhập lại');
        }
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Token đã hết hạn, vui lòng đăng nhập lại');
        }
        throw error;
    }
});

// Restrict to certain roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, 'Bạn không có quyền thực hiện hành động này');
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo
}; 