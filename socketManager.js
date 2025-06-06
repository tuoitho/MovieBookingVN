const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');
const seatSelectionSocketHandler = require('./sockets/seatSelectionSocket');

let io = null;
let seatSelectionManager = null;

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    });

    console.log(`🔌 Socket.IO server setup with CORS origin: ${process.env.FRONTEND_URL}`);

    // Socket.IO middleware for authentication
    io.use(async (socket, next) => {
        try {
            console.log('🔐 Socket authentication attempt...');
            const token = socket.handshake.auth.token;

            if (!token) {
                console.log('❌ No token provided in handshake for socket:', socket.id);
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('_id name email role'); // Fetch necessary user info

            if (!user) {
                console.log('❌ User not found for token used by socket:', socket.id);
                return next(new Error('Authentication error: User not found'));
            }

            // Attach user info to the socket object
            socket.userId = user._id.toString();
            socket.userInfo = {
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            };
            console.log(`👍 Socket ${socket.id} authenticated for user: ${user.name} (${user._id})`);
            next();
        } catch (error) {
            console.error('❌ Socket authentication error:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return next(new Error('Authentication error: Invalid token'));
            }
            if (error.name === 'TokenExpiredError') {
                return next(new Error('Authentication error: Token expired'));
            }
            return next(new Error('Authentication error: Could not authenticate socket'));
        }
    });

    // Initialize specific socket handlers
    seatSelectionManager = seatSelectionSocketHandler(io);
    // Other handlers like notificationSocket(io) could be added here

    console.log('Socket.IO initialized and handlers attached.');
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const getSeatSelectionManager = () => {
    if (!seatSelectionManager) {
        throw new Error("Seat selection manager not initialized!");
    }
    return seatSelectionManager;
};

module.exports = {
    initializeSocket,
    getIO,
    getSeatSelectionManager
};
