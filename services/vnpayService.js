const crypto = require('crypto');
const querystring = require('qs');
const ApiError = require('../utils/ApiError');

class VNPayService {
    constructor() {
        this.tmnCode = process.env.VNPAY_TMN_CODE;
        this.secretKey = process.env.VNPAY_HASH_SECRET;
        this.vnpUrl = process.env.VNPAY_URL;
        this.returnUrl = process.env.VNPAY_RETURN_URL;
    }

    createPaymentUrl(booking) {
        const date = new Date();
        const createDate = this.formatDateTime(date);
        
        const orderId = `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${("0" + date.getDate()).slice(-2)}_${booking._id}`;
        const amount = booking.finalAmount;
        const orderInfo = `BOOKING_${booking._id}`;
        const orderType = 'billpayment';
        const locale = 'vn';
        const currCode = 'VND';

        let vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: currCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: orderType,
            vnp_Amount: amount * 100, // Nhân với 100 vì VNPay yêu cầu số tiền x100
            vnp_ReturnUrl: this.returnUrl,
            vnp_IpAddr: '127.0.0.1', // IP của khách hàng
            vnp_CreateDate: createDate,
        };

        // Sắp xếp các field theo alphabet trước khi tạo chuỗi hash
        vnpParams = this.sortObject(vnpParams);

        // Tạo chuỗi hash
        const signData = querystring.stringify(vnpParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.secretKey);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');
        vnpParams['vnp_SecureHash'] = signed;

        // Tạo URL thanh toán
        const paymentUrl = `${this.vnpUrl}?${querystring.stringify(vnpParams, { encode: false })}`;
        return paymentUrl;
    }

    verifyReturnUrl(vnpParams) {
        // Lấy secure hash từ params
        const secureHash = vnpParams['vnp_SecureHash'];
        
        // Xóa secure hash để tạo chuỗi hash mới
        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        // Sắp xếp params
        vnpParams = this.sortObject(vnpParams);

        // Tạo chuỗi hash mới
        const signData = querystring.stringify(vnpParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.secretKey);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');

        // So sánh chuỗi hash
        if(secureHash !== signed){
            throw new ApiError(400, 'Invalid signature');
        }

        // Kiểm tra status thanh toán
        const responseCode = vnpParams['vnp_ResponseCode'];
        return responseCode === '00';
    }

    // Hàm format ngày giờ theo định dạng yyyyMMddHHmmss
    formatDateTime(date) {
        const pad = (num) => (num < 10 ? '0' + num : num);
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    }

    // Hàm sắp xếp object theo key
    sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        
        for (const key of keys) {
            if (obj.hasOwnProperty(key)) {
                sorted[key] = obj[key];
            }
        }
        return sorted;
    }
}

module.exports = new VNPayService(); 