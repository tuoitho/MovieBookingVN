// In-memory store for selected seats: Map<showtimeId, Map<seatNumber, Array<{userId, socketId, userInfo, timestamp}>>>
const selectedSeatsMap = new Map();
let ioInstance = null; // To store the io instance
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const handleSuccessfulBooking = (showtimeId, seatNumbers, bookedByInfo) => {
    if (!ioInstance) {
        console.error('Socket.IO instance not available for handleSuccessfulBooking');
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

// Xử lý khi ghế trở nên không khả dụng (được chọn bởi user khác)
const handleSeatUnavailable = (showtimeId, seatNumber) => {
    if (!ioInstance) {
        console.error('Socket.IO instance not available for handleSeatUnavailable');
        return;
    }

    const showtimeSelections = selectedSeatsMap.get(showtimeId);
    if (showtimeSelections && showtimeSelections.has(seatNumber)) {
        // Lấy danh sách users đang chọn ghế này
        const users = showtimeSelections.get(seatNumber);
        
        // Thông báo cho từng user rằng ghế đã được chọn bởi user khác
        users.forEach(user => {
            if (user.socketId) {
                ioInstance.to(user.socketId).emit('seat:unavailable-by-others', {
                    showtimeId,
                    seatNumber,
                    message: `Ghế ${seatNumber} đã được chọn bởi user khác`
                });
            }
        });
        
        // Xóa ghế khỏi selection map
        showtimeSelections.delete(seatNumber);
        console.log(`🚫 Seat ${seatNumber} in showtime ${showtimeId} marked as unavailable - selected by another user`);
    }
};


module.exports = (io) => {
    ioInstance = io;
    console.log('🔧 Socket.IO handlers registered with new real-time contention logic.');

    io.on('connection', (socket) => {
        console.log(`✅ User ${socket.userInfo?.name || socket.userId || 'Unknown'} connected with socket ID: ${socket.id}`);

        socket.on('joinShowtime', (showtimeId) => {
            if (!socket.userId) {
                socket.emit('error', { message: 'Authentication error: User ID not found.' });
                return;
            }

            // Leave previous showtime room if exists
            if (socket.currentShowtimeRoom && socket.currentShowtimeRoom !== `showtime-${showtimeId}`) {
                socket.leave(socket.currentShowtimeRoom);
                console.log(`🚪 User ${socket.userId} left room: ${socket.currentShowtimeRoom}`);
            }            const room = `showtime-${showtimeId}`;

            // Check if already in the room
            if (socket.rooms.has(room)) {
                console.log(`⚠️ User ${socket.userId} already in room: ${room}`);
                
                // Vẫn cần gửi initial seat map để cập nhật giao diện
                if (!selectedSeatsMap.has(showtimeId)) {
                    selectedSeatsMap.set(showtimeId, new Map());
                }
                
                const showtimeSelections = selectedSeatsMap.get(showtimeId);
                const initialSeatMap = [];
                showtimeSelections.forEach((users, seatNumber) => {
                    if (users.length > 0) {
                        initialSeatMap.push({
                            seatNumber,
                            status: 'selected',
                            users: users
                        });
                    }
                });

                socket.emit('initial-seat-map', { showtimeId, seats: initialSeatMap });
                console.log(`🗺️ Sent initial seat map for showtime ${showtimeId} to ${socket.userId} (already in room) with ${initialSeatMap.length} selected seats.`);
                return;
            }

            socket.join(room);
            socket.currentShowtimeRoom = room;
            socket.currentShowtimeId = showtimeId;

            console.log(`🚪 User ${socket.userId} joined room: ${room}`);

            // Initialize showtime in map if not present
            if (!selectedSeatsMap.has(showtimeId)) {
                selectedSeatsMap.set(showtimeId, new Map());
            }

            const showtimeSelections = selectedSeatsMap.get(showtimeId);
            const seatsToUpdate = [];

            // Clear any previous selections by this user for this showtime
            showtimeSelections.forEach((users, seatNumber) => {
                const userIndex = users.findIndex(u => u.userId === socket.userId);
                if (userIndex > -1) {
                    users.splice(userIndex, 1);
                    console.log(`🧹 Cleared previous selection/contention for seat ${seatNumber} by user ${socket.userId} on rejoin.`);
                    seatsToUpdate.push(seatNumber);
                }
            });

            // Broadcast updates for cleared seats
            seatsToUpdate.forEach(seatNumber => {
                const remainingUsers = showtimeSelections.get(seatNumber);
                if (remainingUsers && remainingUsers.length > 0) {
                    io.to(room).emit('seat:update', {
                        showtimeId,
                        seatNumber,
                        status: 'selected',
                        users: remainingUsers
                    });
                } else {
                    showtimeSelections.delete(seatNumber); // Clean up empty entry
                    io.to(room).emit('seat:update', {
                        showtimeId,
                        seatNumber,
                        status: 'available',
                        users: []
                    });
                }
            });

            // Send the complete, current seat map to the joining user
            const initialSeatMap = [];
            showtimeSelections.forEach((users, seatNumber) => {
                if (users.length > 0) {
                    initialSeatMap.push({
                        seatNumber,
                        status: 'selected',
                        users: users
                    });
                }
            });

            socket.emit('initial-seat-map', { showtimeId, seats: initialSeatMap });
            console.log(`🗺️ Sent initial seat map for showtime ${showtimeId} to ${socket.userId} with ${initialSeatMap.length} selected seats.`);
        });

        socket.on('seat:selected', ({ showtimeId, seatNumber }) => {
            if (!socket.userId || !socket.userInfo) {
                socket.emit('error', { message: 'Authentication required to select seats.' });
                return;
            }

            const showtimeSelections = selectedSeatsMap.get(showtimeId);
            if (!showtimeSelections) {
                socket.emit('error', { message: `Showtime ${showtimeId} not initialized. Please rejoin.` });
                return;
            }

            if (!showtimeSelections.has(seatNumber)) {
                showtimeSelections.set(seatNumber, []);
            }

            const users = showtimeSelections.get(seatNumber);
            const isAlreadySelectedByUser = users.some(u => u.userId === socket.userId);

            if (isAlreadySelectedByUser) {
                console.log(`ℹ️ User ${socket.userId} re-selected seat ${seatNumber}. No action needed.`);
                return;
            }

            users.push({
                userId: socket.userId,
                socketId: socket.id,
                userInfo: socket.userInfo,
                timestamp: Date.now()
            });

            // Sort by timestamp to ensure the primary holder is always first
            users.sort((a, b) => a.timestamp - b.timestamp);

            console.log(`🪑 User ${socket.userId} selected/contended for seat ${seatNumber}. Total contenders: ${users.length}`);

            io.to(`showtime-${showtimeId}`).emit('seat:update', {
                showtimeId,
                seatNumber,
                status: 'selected',
                users: users
            });
        });

        socket.on('seat:unselected', ({ showtimeId, seatNumber }) => {
            if (!socket.userId) {
                socket.emit('error', { message: 'Authentication required.' });
                return;
            }

            const showtimeSelections = selectedSeatsMap.get(showtimeId);
            if (!showtimeSelections || !showtimeSelections.has(seatNumber)) {
                console.log(`ℹ️ Seat ${seatNumber} was not selected, no action for unselect by ${socket.userId}`);
                return;
            }

            const users = showtimeSelections.get(seatNumber);
            const userIndex = users.findIndex(u => u.userId === socket.userId);

            if (userIndex > -1) {
                users.splice(userIndex, 1);
                console.log(`🟢 User ${socket.userId} unselected seat ${seatNumber}. Remaining contenders: ${users.length}`);

                if (users.length === 0) {
                    showtimeSelections.delete(seatNumber);
                    io.to(`showtime-${showtimeId}`).emit('seat:update', {
                        showtimeId,
                        seatNumber,
                        status: 'available',
                        users: []
                    });
                } else {
                    io.to(`showtime-${showtimeId}`).emit('seat:update', {
                        showtimeId,
                        seatNumber,
                        status: 'selected',
                        users: users
                    });
                }
            } else {
                socket.emit('seat:unselect-failed', { seatNumber, message: 'Không thể bỏ chọn ghế không phải của bạn.' });
            }
        });

        socket.on('leaveShowtime', (showtimeId) => {
            if (!socket.userId) return;

            const room = `showtime-${showtimeId}`;
            socket.leave(room);
            console.log(`🚪 User ${socket.userId} left room: ${room}`);

            // Clear user's selections for this showtime
            const showtimeSelections = selectedSeatsMap.get(showtimeId);
            if (showtimeSelections) {
                showtimeSelections.forEach((users, seatNumber) => {
                    const userIndex = users.findIndex(u => u.userId === socket.userId);
                    if (userIndex > -1) {
                        users.splice(userIndex, 1);
                        if (users.length === 0) {
                            showtimeSelections.delete(seatNumber);
                            io.to(room).emit('seat:update', {
                                showtimeId,
                                seatNumber,
                                status: 'available',
                                users: []
                            });
                        } else {
                            io.to(room).emit('seat:update', {
                                showtimeId,
                                seatNumber,
                                status: 'selected',
                                users: users
                            });
                        }
                    }
                });
            }

            // Clear room reference
            if (socket.currentShowtimeRoom === room) {
                socket.currentShowtimeRoom = null;
                socket.currentShowtimeId = null;
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User ${socket.userInfo?.name || socket.userId || 'Unknown'} (ID: ${socket.id}) disconnected.`);
            if (!socket.userId) return;

            selectedSeatsMap.forEach((showtimeSelections, showtimeId) => {
                showtimeSelections.forEach((users, seatNumber) => {
                    const userIndex = users.findIndex(u => u.socketId === socket.id);
                    if (userIndex > -1) {
                        users.splice(userIndex, 1);
                        console.log(`🧹 Cleaned up seat ${seatNumber} in showtime ${showtimeId} due to disconnect of ${socket.id}. Remaining: ${users.length}`);

                        if (users.length === 0) {
                            showtimeSelections.delete(seatNumber);
                            io.to(`showtime-${showtimeId}`).emit('seat:update', {
                                showtimeId,
                                seatNumber,
                                status: 'available',
                                users: []
                            });
                        } else {
                            io.to(`showtime-${showtimeId}`).emit('seat:update', {
                                showtimeId,
                                seatNumber,
                                status: 'selected',
                                users: users
                            });
                        }
                    }
                });
            });
        });
    });

    setInterval(() => {
        if (!ioInstance) return;
        const now = Date.now();

        selectedSeatsMap.forEach((showtimeSelections, showtimeId) => {
            showtimeSelections.forEach((users, seatNumber) => {
                let usersTimedOut = false;
                const initialUserCount = users.length;

                for (let i = users.length - 1; i >= 0; i--) {
                    const selection = users[i];
                    if (selection.timestamp && (now - selection.timestamp > IDLE_TIMEOUT_MS)) {
                        console.log(`⏳ Seat ${seatNumber} selection by ${selection.userInfo?.name} timed out.`);
                        const timedOutUserSocketId = selection.socketId;
                        users.splice(i, 1);
                        usersTimedOut = true;

                        if (timedOutUserSocketId) {
                            ioInstance.to(timedOutUserSocketId).emit('seat:selection-timed-out', {
                                showtimeId,
                                seatNumber,
                                message: `Your selection for seat ${seatNumber} has timed out.`
                            });
                        }
                    }
                }

                if (usersTimedOut) {
                     console.log(`⏳ Timed out users removed from seat ${seatNumber}. Before: ${initialUserCount}, After: ${users.length}`);
                    if (users.length === 0) {
                        showtimeSelections.delete(seatNumber);
                        ioInstance.to(`showtime-${showtimeId}`).emit('seat:update', {
                            showtimeId,
                            seatNumber,
                            status: 'available',
                            users: []
                        });
                    } else {
                        ioInstance.to(`showtime-${showtimeId}`).emit('seat:update', {
                            showtimeId,
                            seatNumber,
                            status: 'selected',
                            users: users
                        });
                    }
                }
            });
        });
    }, 30 * 1000);    return {
        handleSuccessfulBooking,
        handleSeatUnavailable
    };
};
