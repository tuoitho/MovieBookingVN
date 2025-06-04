const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// Protect routes - Authentication check
const protect = catchAsync(async (req, res, next) => {
    // 1) Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'You are not logged in. Please log in to get access.');
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
        throw new ApiError(401, 'The user belonging to this token no longer exists.');
    }

    // 4) Check if user changed password after the token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
        throw new ApiError(401, 'User recently changed password! Please log in again.');
    }

    // Grant access to protected route
    req.user = user;
    next();
});

// Restrict to certain roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, 'You do not have permission to perform this action');
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo
}; 