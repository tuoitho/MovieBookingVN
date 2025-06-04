const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { log } = require('winston');

// Protect routes - Authentication check
const protect = async (req, res, next) => {
    try {
        let token;
        
        // Check if token exists in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
        //in ra thoi gian het han cua token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const timestamp = new Date(decoded.exp * 1000).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
        console.log(timestamp);
        // trích xuất tất cả các thông tin của token
        console.log(decoded)

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        console.error('Lỗi trong hàm protect:', error);
        next(error);
    }
};

// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as an admin'
        });
    }
};

module.exports = {
    protect,
    admin
}; 