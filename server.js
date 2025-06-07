const { setupColoredConsole } = require('./utils/logger');

// Thiết lập console với màu sắc
setupColoredConsole();

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const movieRoutes = require('./routes/movieRoutes');
const cinemaRoutes = require('./routes/cinemaRoutes');
const showtimeRoutes = require('./routes/showtimeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const { initializeSocket } = require('./socketManager'); // Import the new socket manager
const bookingService = require('./services/bookingService');

// Initialize express app
const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS
app.use(hpp()); // Prevent parameter pollution

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100000 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/movies', movieRoutes);
app.use('/api/v1/cinemas', cinemaRoutes);
app.use('/api/v1/showtimes', showtimeRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/promotions', promotionRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Bắt đầu cron job để xử lý booking hết hạn
    const JOB_INTERVAL_MS = 60 * 1000; // Chạy mỗi phút
    const bookingExpirationJob = setInterval(async () => {
        try {
            console.log('Running booking expiration job...');
            const count = await bookingService.handleAllExpiredBookings();
            if (count > 0) {
                console.log(`Booking expiration job finished. Processed ${count} expired bookings.`);
            }
        } catch (error) {
            console.error('Error in booking expiration job:', error);
        }
    }, JOB_INTERVAL_MS);

    // Đảm bảo dừng job khi tắt server
    process.on('SIGTERM', () => {
        console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
        clearInterval(bookingExpirationJob);
        server.close(() => {
            console.log('💥 Process terminated!');
        });
    });
});

// Initialize Socket.IO using the manager
initializeSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle SIGTERM signal for graceful shutdown (e.g., from Docker or Heroku)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});