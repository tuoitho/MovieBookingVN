const Booking = require('../models/bookingModel');
const Showtime = require('../models/showtimeModel');
const Promotion = require('../models/promotionModel');
const ApiError = require('../utils/ApiError');
const { getIO } = require('../socketManager'); // <<< THAY ĐỔI: Sử dụng getIO để emit socket
const showtimeService = require('./showtimeService');

class BookingService {
    // Tạo booking mới
    async createBooking(bookingData) {
        const showtime = await Showtime.findById(bookingData.showtimeId);
        if (!showtime) {
            throw new ApiError(404, 'Không tìm thấy suất chiếu');
        }

        const selectedSeats = [];
        let totalAmount = 0;

        for (const seatNumber of bookingData.seatNumbers) {
            let seatFound = false;
            for (const row of showtime.seatsAvailable) {
                for (const seat of row) {
                    if (seat.seatNumber === seatNumber) {
                        seatFound = true;
                        if (seat.status !== 'available') {
                            throw new ApiError(400, `Ghế ${seatNumber} không còn trống hoặc đang được giữ`);
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
        
        // <<< BẮT ĐẦU PHẦN LOGIC MỚI >>>
        // Đánh dấu các ghế là 'unavailable' ngay lập tức để giữ chỗ
        for (const seat of selectedSeats) {
            await showtimeService.updateSeatStatus(showtime._id, seat.seatNumber, 'unavailable');
        }
        // <<< KẾT THÚC PHẦN LOGIC MỚI >>>

        // Tính giảm giá nếu có
        let discountAmount = 0;
        let promotionId = null;
        if (bookingData.promotionCode) {
            // Logic xử lý promotion
            const promotion = await Promotion.findValidByCode(bookingData.promotionCode);
            if (promotion && promotion.isApplicableToOrder(totalAmount, showtime.movieId, showtime._id)) {
                discountAmount = promotion.calculateDiscount(totalAmount);
                promotionId = promotion._id;
            } else {
                 throw new ApiError(400, 'Mã khuyến mãi không hợp lệ hoặc không áp dụng được.');
            }
        }        const booking = await Booking.create({
            userId: bookingData.userId,
            showtimeId: bookingData.showtimeId,
            seats: selectedSeats,
            totalAmount,
            discountAmount,
            finalAmount: totalAmount - discountAmount,
            paymentMethod: bookingData.paymentMethod,
            promotionId: promotionId,
            status: 'pending',
            expiredAt: new Date(Date.now() + 30000) // 30s
        });        // <<< THÊM MỚI: Gửi thông báo socket về các ghế vừa được giữ >>>
        const io = getIO();
        const seatSelectionManager = require('../socketManager').getSeatSelectionManager();
        const room = `showtime-${booking.showtimeId}`;
        
        // Xóa ghế khỏi danh sách temp selection và thông báo ghế đã được chọn bởi user khác
        if (seatSelectionManager) {
            // Loại bỏ ghế khỏi selection map để không ai có thể chọn nữa
            booking.seats.forEach(seat => {
                seatSelectionManager.handleSeatUnavailable(booking.showtimeId.toString(), seat.seatNumber);
            });
        }
        
        const seatUpdates = booking.seats.map(seat => ({
            showtimeId: booking.showtimeId,
            seatNumber: seat.seatNumber,
            status: 'unavailable', // Trạng thái ghế đang được giữ bởi user khác
            users: [], // Không có ai đang chọn nữa
            message: `Ghế ${seat.seatNumber} đã được chọn bởi user khác`
        }));
        
        seatUpdates.forEach(update => io.to(room).emit('seat:update', update));
        console.log(`Socket: Emitted ${seatUpdates.length} seat updates (status: unavailable - được chọn bởi user khác) to room ${room}`);
        // <<< KẾT THÚC PHẦN THÊM MỚI >>>

        return booking;
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

        // <<< BẮT ĐẦU PHẦN SỬA ĐỔI >>>
        // Cập nhật trạng thái ghế về available
        const showtime = await Showtime.findById(booking.showtimeId);
        if (showtime) {
            for (const seat of booking.seats) {
                await showtimeService.updateSeatStatus(showtime._id, seat.seatNumber, 'available');
            }

            // Gửi thông báo socket về các ghế vừa được hoàn trả
            const io = getIO();
            const room = `showtime-${booking.showtimeId}`;
            const seatUpdates = booking.seats.map(seat => ({
                showtimeId: booking.showtimeId,
                seatNumber: seat.seatNumber,
                status: 'available',
                users: []
            }));
            seatUpdates.forEach(update => io.to(room).emit('seat:update', update));
            console.log(`Socket: Emitted ${seatUpdates.length} seat updates (status: available) to room ${room} due to cancellation.`);
        }
        // <<< KẾT THÚC PHẦN SỬA ĐỔI >>>

        return booking;
    }

    // Xử lý callback từ cổng thanh toán
    async handlePaymentCallback(bookingId, paymentData) {
        const booking = await Booking.findById(bookingId).populate('userId', 'name email');
        if (!booking) {
            throw new ApiError(404, 'Không tìm thấy booking');
        }
        
        // Tránh xử lý lại booking đã hoàn tất hoặc thất bại
        if (booking.status !== 'pending') {
            console.warn(`Attempted to process a non-pending booking: ${bookingId}, status: ${booking.status}`);
            return booking;
        }

        if (paymentData.status === 'success') {
            await booking.updatePaymentStatus('completed', {
                transactionId: paymentData.transactionId,
                rawResponse: paymentData
            });

            // <<< SỬA ĐỔI: Chuyển ghế từ 'unavailable' -> 'booked' >>>
            const showtime = await Showtime.findById(booking.showtimeId);
            if(showtime){
                for (const seat of booking.seats) {
                    await showtimeService.updateSeatStatus(showtime._id, seat.seatNumber, 'booked');
                }

                // Gửi thông báo socket về các ghế đã được đặt thành công
                const io = getIO();
                const seatSelectionManager = require('../socketManager').getSeatSelectionManager();
                if (io && seatSelectionManager) {
                    const bookedByInfo = { 
                        userId: booking.userId._id.toString(), 
                        name: booking.userId.name,
                        email: booking.userId.email
                    };
                    seatSelectionManager.handleSuccessfulBooking(
                        booking.showtimeId.toString(),
                        booking.seats.map(s => s.seatNumber),
                        bookedByInfo
                    );
                }
            }
        } else {
            // <<< THÊM MỚI: Xử lý khi thanh toán thất bại >>>
            await booking.updatePaymentStatus('failed', {
                rawResponse: paymentData
            });
            booking.status = 'cancelled'; // Chuyển booking sang 'cancelled'
            await booking.save();

            // Hoàn trả ghế về 'available'
            const showtime = await Showtime.findById(booking.showtimeId);
            if (showtime) {
                for (const seat of booking.seats) {
                    await showtimeService.updateSeatStatus(showtime._id, seat.seatNumber, 'available');
                }
                const io = getIO();
                const room = `showtime-${booking.showtimeId}`;
                const seatUpdates = booking.seats.map(seat => ({
                    showtimeId: booking.showtimeId,
                    seatNumber: seat.seatNumber,
                    status: 'available',
                    users: []
                }));
                seatUpdates.forEach(update => io.to(room).emit('seat:update', update));
                console.log(`Socket: Emitted ${seatUpdates.length} seat updates (status: available) to room ${room} due to failed payment.`);
            }
        }
        return booking;
    }
    
    // <<< THÊM MỚI: Hàm xử lý các booking hết hạn >>>
    async handleAllExpiredBookings() {
        const now = new Date();
        const expiredBookings = await Booking.find({
            status: 'pending',
            expiredAt: { $lt: now }
        });

        if (expiredBookings.length === 0) {
            return 0; // Không có gì để làm
        }
        
        console.log(`Found ${expiredBookings.length} expired bookings to process.`);

        for (const booking of expiredBookings) {
            booking.status = 'expired';
            await booking.save();
            
            console.log(`Booking ${booking._id} status updated to 'expired'.`);

            // Hoàn trả ghế
            const showtime = await Showtime.findById(booking.showtimeId);
            if (showtime) {
                for (const seat of booking.seats) {
                    await showtimeService.updateSeatStatus(showtime._id, seat.seatNumber, 'available');
                }
                // Gửi thông báo socket
                const io = getIO();
                const room = `showtime-${booking.showtimeId}`;
                const seatUpdates = booking.seats.map(seat => ({
                    showtimeId: booking.showtimeId,
                    seatNumber: seat.seatNumber,
                    status: 'available',
                    users: []
                }));
                seatUpdates.forEach(update => io.to(room).emit('seat:update', update));
                console.log(`Socket: Emitted ${seatUpdates.length} seat updates (status: available) to room ${room} due to expiration.`);
            }
        }

        return expiredBookings.length;
    }
}

module.exports = new BookingService();