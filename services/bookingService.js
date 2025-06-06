const Booking = require('../models/bookingModel');
const Showtime = require('../models/showtimeModel');
const Promotion = require('../models/promotionModel');
const ApiError = require('../utils/ApiError');
const { getSeatSelectionManager } = require('../socketManager'); // Import the manager

class BookingService {
    // Tạo booking mới
    async createBooking(bookingData) {
        try {
            // Kiểm tra suất chiếu và ghế
            const showtime = await Showtime.findById(bookingData.showtimeId);
            if (!showtime) {
                throw new ApiError(404, 'Không tìm thấy suất chiếu');
            }

            // Kiểm tra xem ghế có tồn tại và còn trống không
            const selectedSeats = [];
            let totalAmount = 0;

            for (const seatNumber of bookingData.seatNumbers) {
                let seatFound = false;
                for (const row of showtime.seatsAvailable) {
                    for (const seat of row) {
                        if (seat.seatNumber === seatNumber) {
                            seatFound = true;
                            if (seat.status !== 'available') {
                                throw new ApiError(400, `Ghế ${seatNumber} không còn trống`);
                            }
                            selectedSeats.push({
                                seatNumber: seat.seatNumber,
                                type: seat.type,
                                price: seat.price
                            });
                            totalAmount += seat.price;
                            break;
                        }
                    }
                    if (seatFound) break;
                }
                if (!seatFound) {
                    throw new ApiError(400, `Ghế ${seatNumber} không tồn tại`);
                }
            }

            // Tính giảm giá nếu có
            let discountAmount = 0;
            if (bookingData.promotionCode) {
                const promotion = await Promotion.findOne({ 
                    code: bookingData.promotionCode,
                    status: 'active',
                    startDate: { $lte: new Date() },
                    endDate: { $gt: new Date() }
                });

                if (!promotion) {
                    throw new ApiError(400, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
                }

                // Tính số tiền giảm giá
                if (promotion.type === 'percentage') {
                    discountAmount = (totalAmount * promotion.value) / 100;
                    if (promotion.maxDiscount) {
                        discountAmount = Math.min(discountAmount, promotion.maxDiscount);
                    }
                } else {
                    discountAmount = promotion.value;
                }

                bookingData.promotionId = promotion._id;
            }

            // Tạo thời gian hết hạn (15 phút từ khi tạo)
            const expiredAt = new Date();
            expiredAt.setMinutes(expiredAt.getMinutes() + 15);

            // Tạo booking
            const booking = await Booking.create({
                userId: bookingData.userId,
                showtimeId: bookingData.showtimeId,
                seats: selectedSeats,
                totalAmount,
                discountAmount,
                finalAmount: totalAmount - discountAmount,
                paymentMethod: bookingData.paymentMethod,
                status: 'pending', // Initial status
                expiredAt
            });

            // If booking is for 0 amount (e.g. fully discounted) and successful,
            // treat it as 'completed' immediately and update seats.
            if (booking.finalAmount === 0) {
                booking.status = 'completed';
                booking.paymentDetails = {
                    transactionId: `FREE_${Date.now()}`,
                    status: 'completed',
                    message: 'Free booking due to promotion'
                };
                await booking.save();

                // Update seat status in DB
                for (const seat of booking.seats) {
                    await showtime.updateSeatStatus(seat.seatNumber, 'booked');
                }

                // Notify via sockets
                const seatSelectionManager = getSeatSelectionManager();
                if (seatSelectionManager) {
                    const bookedByInfo = { 
                        userId: bookingData.userId, // Assuming bookingData.userId is the user's ID string
                        name: bookingData.userName, // Pass userName if available
                        email: bookingData.userEmail // Pass userEmail if available
                    };
                    // console.log(`Calling handleSuccessfulBooking for showtime ${booking.showtimeId} with seats ${booking.seats.map(s => s.seatNumber)} by ${JSON.stringify(bookedByInfo)}`);
                    seatSelectionManager.handleSuccessfulBooking(
                        booking.showtimeId.toString(),
                        booking.seats.map(s => s.seatNumber),
                        bookedByInfo
                    );
                }
            }
            // Ghế sẽ được track qua booking record và socket selectedBy array
            // Không cần cập nhật status vì schema chỉ cho phép: available, booked, unavailable

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Lấy chi tiết booking
    async getBookingById(bookingId, userId) {
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'showtime',
                populate: {
                    path: 'movieId',
                    select: 'title posterUrl duration'
                }
            })
            .populate('user', 'name email phone');

        if (!booking) {
            throw new ApiError(404, 'Không tìm thấy booking');
        }

        // Chỉ cho phép user xem booking của chính họ
        if (booking.userId.toString() !== userId.toString()) {
            throw new ApiError(403, 'Bạn không có quyền xem booking này');
        }

        return booking;
    }

    // Lấy danh sách booking của user
    async getBookingsByUser(userId, status) {
        const query = { userId };
        if (status) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate({
                path: 'showtime',
                populate: {
                    path: 'movieId',
                    select: 'title posterUrl'
                }
            })
            .sort({ createdAt: -1 });

        return bookings;
    }

    // Hủy booking
    async cancelBooking(bookingId, userId) {
        const booking = await this.getBookingById(bookingId, userId);

        if (!booking.canCancel()) {
            throw new ApiError(400, 'Không thể hủy booking này');
        }

        // Cập nhật trạng thái booking
        booking.status = 'cancelled';
        await booking.save();

        // Cập nhật trạng thái ghế về available
        const showtime = await Showtime.findById(booking.showtimeId);
        for (const seat of booking.seats) {
            await showtime.updateSeatStatus(seat.seatNumber, 'available');
        }

        return booking;
    }

    // Xử lý callback từ cổng thanh toán
    async handlePaymentCallback(bookingId, paymentData) {
        const booking = await Booking.findById(bookingId).populate('userId', 'name email'); // Populate user info
        if (!booking) {
            throw new ApiError(404, 'Không tìm thấy booking');
        }
        // console.log(paymentData);
        // Xử lý kết quả thanh toán
        if (paymentData.status === 'success') {
            await booking.updatePaymentStatus('completed', {
                transactionId: paymentData.transactionId,
                rawResponse: paymentData
            });

            // Cập nhật trạng thái ghế thành booked
            const showtime = await Showtime.findById(booking.showtimeId);
            for (const seat of booking.seats) {
                await showtime.updateSeatStatus(seat.seatNumber, 'booked');
            }

            // Notify via sockets
            const seatSelectionManager = getSeatSelectionManager();
            if (seatSelectionManager && booking.userId) {
                const bookedByInfo = { 
                    userId: booking.userId._id.toString(), 
                    name: booking.userId.name,
                    email: booking.userId.email
                };
                // console.log(`Calling handleSuccessfulBooking (payment) for showtime ${booking.showtimeId} with seats ${booking.seats.map(s => s.seatNumber)} by ${JSON.stringify(bookedByInfo)}`);
                seatSelectionManager.handleSuccessfulBooking(
                    booking.showtimeId.toString(),
                    booking.seats.map(s => s.seatNumber),
                    bookedByInfo
                );
            }

        } else {
            await booking.updatePaymentStatus('failed', {
                rawResponse: paymentData
            });

            // Cập nhật trạng thái ghế về available (SHOULD NOT HAPPEN if seats were only 'selected' temporarily)
            // This part might be redundant if seats are not marked 'booked' in DB until payment success.
            // However, if a booking record was created and then payment failed, these seats should become available again.
            // The current socket logic primarily handles temporary selections.
            // For failed payments, the booking status becomes 'failed', and seats are not 'booked'.
            // No need to revert seat status here if they were never 'booked' in DB for this pending booking.
            // The `handleExpiredBookings` or a cancellation flow would handle releasing them if they were held.
            // For now, let's assume the temporary selection map is the source of truth for non-booked seats.
        }

        return booking;
    }

    // Xử lý booking hết hạn
    async handleExpiredBookings() {
        const expiredBookings = await Booking.find({
            status: 'pending',
            expiredAt: { $lt: new Date() }
        });

        for (const booking of expiredBookings) {
            booking.status = 'expired';
            await booking.save();

            // Cập nhật trạng thái ghế về available
            const showtime = await Showtime.findById(booking.showtimeId);
            for (const seat of booking.seats) {
                await showtime.updateSeatStatus(seat.seatNumber, 'available');
            }
        }

        return expiredBookings.length;
    }
}

module.exports = new BookingService();