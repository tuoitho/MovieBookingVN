// const Showtime = require('../models/showtimeModel'); // Not needed for temporary selection tracking

// In-memory store for selected seats: Map<showtimeId, Map<seatNumber, {userId, socketId, userInfo, timestamp}>>
const selectedSeatsMap = new Map();
let ioInstance = null; // To store the io instance
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const handleSuccessfulBooking = (showtimeId, seatNumbers, bookedByInfo) => {
    if (!ioInstance) {
        console.error('Socket.IO instance not available in seatSelectionSocket for handleSuccessfulBooking');
        return;
    }

    const showtimeSelections = selectedSeatsMap.get(showtimeId);
    if (showtimeSelections) {
        seatNumbers.forEach(seatNumber => {
            if (showtimeSelections.has(seatNumber)) {
                showtimeSelections.delete(seatNumber);
                console.log(`🧹 Seat ${seatNumber} in showtime ${showtimeId} removed from temp map due to booking by ${bookedByInfo?.name || bookedByInfo?.userId}.`);
            }
        });
    }

    const room = `showtime-${showtimeId}`;
    ioInstance.to(room).emit('seats-booked', {
        showtimeId,
        seatNumbers,
        bookedBy: bookedByInfo
    });
    console.log(`📢 Emitted seats-booked to room ${room} for seats: ${seatNumbers.join(', ')} by ${bookedByInfo?.name || bookedByInfo?.userId}`);
};


module.exports = (io) => {
    ioInstance = io; // Store the io instance
    console.log('🔧 Socket.IO handlers registered with new in-memory strategy, including idle timeout.');

    io.on('connection', (socket) => {
        // socket.userId and socket.userInfo should be populated by the authentication middleware
        console.log(`✅ User ${socket.userInfo?.name || socket.userId || 'Unknown'} connected with socket ID: ${socket.id}`);
        if (socket.userInfo) {
            console.log(`🔐 User info:`, socket.userInfo);
        } else {
            console.warn(`⚠️ User info not available for socket ID: ${socket.id}. Ensure authentication middleware is working.`);
        }


        // Join a specific showtime room
        socket.on('joinShowtime', (showtimeId) => {
            if (!socket.userId) {
                console.error(`❌ Attempt to join showtime without userId for socket ${socket.id}`);
                socket.emit('error', { message: 'Authentication error: User ID not found.' });
                return;
            }
            const room = `showtime-${showtimeId}`;
            socket.join(room);
            socket.currentShowtimeRoom = room;
            socket.currentShowtimeId = showtimeId; // Store for easier access on disconnect

            console.log(`🚪 User ${socket.userId} joined room: ${room}`);

            // Initialize showtime in map if not present
            if (!selectedSeatsMap.has(showtimeId)) {
                selectedSeatsMap.set(showtimeId, new Map());
            }            // Send current selected seats for this showtime to the joining user
            const currentShowtimeSelections = selectedSeatsMap.get(showtimeId) || new Map();
            const initialSeatUpdates = [];
            currentShowtimeSelections.forEach((selection, seatNumber) => {
                initialSeatUpdates.push({
                    seatNumber,
                    status: 'selected',
                    // Format consistently as users array to make frontend handling simpler
                    users: [{
                        userId: selection.userId,
                        userInfo: selection.userInfo,
                    }]
                });
            });

            if (initialSeatUpdates.length > 0) {
                socket.emit('initial-seat-map', { showtimeId, seats: initialSeatUpdates });
                console.log(`🗺️ Sent initial seat map for showtime ${showtimeId} to ${socket.userId}:`, initialSeatUpdates.length, "seats");
            } else {
                 socket.emit('initial-seat-map', { showtimeId, seats: [] }); // Send empty if no selections
                console.log(`🗺️ No initial selected seats for showtime ${showtimeId} to send to ${socket.userId}`);
            }
        });

        // Handle seat selection
        socket.on('seat:selected', ({ showtimeId, seatNumber }) => {
            if (!socket.userId || !socket.userInfo) {
                console.error(`❌ seat:selected from unauthenticated socket ${socket.id}`);
                socket.emit('error', { message: 'Authentication required to select seats.' });
                return;
            }
            if (!showtimeId || !seatNumber) {
                socket.emit('error', { message: 'Missing showtimeId or seatNumber for seat:selected' });
                return;
            }

            const showtimeSelections = selectedSeatsMap.get(showtimeId);
            if (!showtimeSelections) {
                console.warn(`⚠️ Showtime ${showtimeId} not found in selectedSeatsMap. Client might not have joined room.`);
                 socket.emit('error', { message: `Showtime ${showtimeId} not initialized. Please rejoin.` });
                return;
            }

            const existingSelection = showtimeSelections.get(seatNumber);

            if (existingSelection && existingSelection.userId !== socket.userId) {
                console.log(`🚫 Seat ${seatNumber} in showtime ${showtimeId} already selected by user ${existingSelection.userId}`);
                socket.emit('seat:select-failed', {
                    seatNumber,
                    message: 'Ghế này đã được người khác chọn.',
                    currentHolder: existingSelection.userInfo
                });
                return;
            }

            // Select the seat
            showtimeSelections.set(seatNumber, {
                userId: socket.userId,
                socketId: socket.id,
                userInfo: socket.userInfo, // Store userInfo for richer display on client
                timestamp: Date.now() // Add timestamp for idle tracking
            });
            console.log(`🪑 User ${socket.userId} selected seat ${seatNumber} in showtime ${showtimeId}`);

            // Broadcast update to all users in the showtime room
            io.to(`showtime-${showtimeId}`).emit('seat:update', {
                showtimeId,
                seatNumber,
                status: 'selected',
                userId: socket.userId,
                userInfo: socket.userInfo
            });
        });

        // Handle seat deselection
        socket.on('seat:unselected', ({ showtimeId, seatNumber }) => {
            if (!socket.userId) {
                console.error(`❌ seat:unselected from unauthenticated socket ${socket.id}`);
                socket.emit('error', { message: 'Authentication required.' });
                return;
            }
             if (!showtimeId || !seatNumber) {
                socket.emit('error', { message: 'Missing showtimeId or seatNumber for seat:unselected' });
                return;
            }

            const showtimeSelections = selectedSeatsMap.get(showtimeId);
            if (!showtimeSelections) {
                console.warn(`⚠️ Showtime ${showtimeId} not found in selectedSeatsMap for unselection.`);
                socket.emit('error', { message: `Showtime ${showtimeId} not initialized for unselection.` });
                return;
            }

            const selection = showtimeSelections.get(seatNumber);

            if (selection && selection.userId === socket.userId) {
                showtimeSelections.delete(seatNumber);
                console.log(`🟢 User ${socket.userId} unselected seat ${seatNumber} in showtime ${showtimeId}`);

                // Broadcast update to all users in the showtime room
                io.to(`showtime-${showtimeId}`).emit('seat:update', {
                    showtimeId,
                    seatNumber,
                    status: 'available', 
                    userId: null,
                    userInfo: null
                });
            } else if (selection) {
                console.warn(`⚠️ User ${socket.userId} tried to unselect seat ${seatNumber} held by ${selection.userId}`);
                socket.emit('seat:unselect-failed', { seatNumber, message: 'Không thể bỏ chọn ghế không phải của bạn.' });
            } else {
                console.log(`ℹ️ Seat ${seatNumber} in showtime ${showtimeId} was not selected, no action for unselect by ${socket.userId}`);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`🔌 User ${socket.userInfo?.name || socket.userId || 'Unknown'} (ID: ${socket.id}) disconnected.`);

            if (!socket.userId && !socket.id) { // Check both as fallback
                console.warn(`⚠️ Disconnected socket had no userId or socket.id. No seats to clean up.`);
                return;
            }
            
            selectedSeatsMap.forEach((showtimeSelections, showtimeId) => {
                const seatsToUpdate = [];
                showtimeSelections.forEach((selection, seatNumber) => {
                    if (selection.socketId === socket.id) {
                        seatsToUpdate.push(seatNumber);
                    }
                });

                seatsToUpdate.forEach(seatNumber => {
                    showtimeSelections.delete(seatNumber);
                    console.log(`🧹 Cleaned up seat ${seatNumber} in showtime ${showtimeId} due to disconnect of socket ${socket.id}`);
                    io.to(`showtime-${showtimeId}`).emit('seat:update', {
                        showtimeId,
                        seatNumber,
                        status: 'available',
                        userId: null,
                        userInfo: null
                    });
                });
            });
        });
    });

    // Start idle timeout checker
    setInterval(() => {
        if (!ioInstance) return;

        const now = Date.now();
        selectedSeatsMap.forEach((showtimeSelections, showtimeId) => {
            showtimeSelections.forEach((selection, seatNumber) => {
                if (selection.timestamp && (now - selection.timestamp > IDLE_TIMEOUT_MS)) {
                    // Seat selection has timed out
                    showtimeSelections.delete(seatNumber);
                    console.log(`⏳ Seat ${seatNumber} in showtime ${showtimeId} timed out for user ${selection.userInfo?.name || selection.userId}. Removing selection.`);

                    const room = `showtime-${showtimeId}`;
                    ioInstance.to(room).emit('seat:update', {
                        showtimeId,
                        seatNumber,
                        status: 'available',
                        userId: null,
                        userInfo: null
                    });

                    // Notify the specific user whose selection timed out
                    if (selection.socketId) {
                        ioInstance.to(selection.socketId).emit('seat:selection-timed-out', {
                            showtimeId,
                            seatNumber,
                            message: `Your selection for seat ${seatNumber} has timed out.`
                        });
                    }
                }
            });
        });
    }, 30 * 1000); // Check every 30 seconds

    // Return the manager object
    return {
        handleSuccessfulBooking
    };
};
