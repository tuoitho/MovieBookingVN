const bookingService = require('../services/bookingService');
const vnpayService = require('../services/vnpayService');
const catchAsync = require('../utils/catchAsync');

const bookingController = {
    // Tạo booking mới
    createBooking: catchAsync(async (req, res) => {
        // Thêm userId từ user đã đăng nhập
        const bookingData = {
            ...req.body,
            userId: req.user._id
        };

        const booking = await bookingService.createBooking(bookingData);
        
        // Nếu phương thức thanh toán là VNPay, tạo URL thanh toán
        let paymentUrl = null;
        if (booking.paymentMethod === 'vnpay') {
            paymentUrl = vnpayService.createPaymentUrl(booking);
        }
        
        res.status(201).json({
            status: 'success',
            data: { 
                booking,
                paymentUrl 
            }
        });
    }),

    // Lấy chi tiết booking
    getBooking: catchAsync(async (req, res) => {
        const booking = await bookingService.getBookingById(
            req.params.id,
            req.user._id
        );

        res.json({
            status: 'success',
            data: { booking }
        });
    }),

    // Lấy danh sách booking của user
    getMyBookings: catchAsync(async (req, res) => {
        const bookings = await bookingService.getBookingsByUser(
            req.user._id,
            req.query.status
        );

        res.json({
            status: 'success',
            results: bookings.length,
            data: { bookings }
        });
    }),

    // Hủy booking
    cancelBooking: catchAsync(async (req, res) => {
        const booking = await bookingService.cancelBooking(
            req.params.id,
            req.user._id
        );

        res.json({
            status: 'success',
            data: { booking }
        });
    }),

    // Xử lý callback từ VNPay
    handleVNPayCallback: catchAsync(async (req, res) => {
        const vnpayResponse = { ...req.query };
        
        // **SỬA LẠI: Không gọi verify ở đây nữa, gọi trong service nếu cần**
        const isValidPayment = vnpayService.verifyReturnUrl(vnpayResponse);

        // **SỬA LỖI LOGIC QUAN TRỌNG: Lấy bookingId từ vnp_TxnRef**
        // vnp_TxnRef có định dạng: `${date.getTime()}_${booking._id}`
        const bookingId = vnpayResponse.vnp_TxnRef.split('_')[1];

        // Dữ liệu để cập nhật vào booking
        const paymentData = {
            status: isValidPayment && vnpayResponse.vnp_ResponseCode === '00' ? 'success' : 'failed',
            transactionId: vnpayResponse.vnp_TransactionNo,
            rawResponse: vnpayResponse
        };
        
        // Cập nhật trạng thái booking dựa trên kết quả thanh toán
        await bookingService.handlePaymentCallback(bookingId, paymentData);

        // Chuyển hướng người dùng về trang kết quả thanh toán trên frontend
        const redirectUrl = new URL(`${process.env.FRONTEND_URL}/payment/result`);
        redirectUrl.searchParams.set('bookingId', bookingId);
        redirectUrl.searchParams.set('status', paymentData.status);
        redirectUrl.searchParams.set('message', isValidPayment ? 'Payment successful' : 'Payment failed or invalid signature');
        redirectUrl.searchParams.set('orderId', vnpayResponse.vnp_TxnRef);
        redirectUrl.searchParams.set('amount', vnpayResponse.vnp_Amount / 100);

        res.redirect(redirectUrl.toString());
    }),

    // Xử lý callback từ Momo
    handleMomoCallback: catchAsync(async (req, res) => {
        const momoData = {
            status: req.body.resultCode === 0 ? 'success' : 'failed',
            transactionId: req.body.transId,
            amount: req.body.amount,
            orderInfo: req.body.orderInfo,
            payType: req.body.payType,
            rawResponse: req.body
        };

        const bookingId = req.body.orderInfo.split('_')[1]; // Format: "BOOKING_id"
        const booking = await bookingService.handlePaymentCallback(bookingId, momoData);

        // Chuyển hướng người dùng về trang kết quả thanh toán
        res.redirect(`${process.env.FRONTEND_URL}/payment/result?bookingId=${booking._id}&status=${momoData.status}`);
    }),

    // Xử lý callback từ ZaloPay
    handleZaloPayCallback: catchAsync(async (req, res) => {
        const zaloPayData = {
            status: req.body.status === 1 ? 'success' : 'failed',
            transactionId: req.body.zp_trans_id,
            amount: req.body.amount,
            description: req.body.description,
            bankCode: req.body.bank_code,
            rawResponse: req.body
        };

        const bookingId = req.body.description.split('_')[1]; // Format: "BOOKING_id"
        const booking = await bookingService.handlePaymentCallback(bookingId, zaloPayData);

        // API callback từ ZaloPay không cần redirect
        res.json({
            return_code: 1,
            return_message: 'success'
        });
    }),

    // Xử lý các booking hết hạn (Gọi bởi cron job)
    handleExpiredBookings: catchAsync(async (req, res) => {
        const processedCount = await bookingService.handleExpiredBookings();

        res.json({
            status: 'success',
            message: `Đã xử lý ${processedCount} booking hết hạn`
        });
    })
};

module.exports = bookingController; 