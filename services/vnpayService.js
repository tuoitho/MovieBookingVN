// vnpayService.js

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

        const expireDate = new Date();
        expireDate.setMinutes(date.getMinutes() + 15);
        const vnp_ExpireDate = this.formatDateTime(expireDate);

        // **THAY ĐỔI: Sử dụng booking._id trực tiếp trong TxnRef để dễ dàng truy xuất**
        const orderId = `${date.getTime()}_${booking._id}`; 

        let vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Amount: Math.round(booking.finalAmount) * 100,
            vnp_CreateDate: createDate,
            vnp_CurrCode: 'VND',
            vnp_IpAddr: '127.0.0.1', // Lấy IP thực tế khi deploy
            vnp_Locale: 'vn',
            vnp_OrderInfo: `Thanh toan cho don hang ${booking._id}`,
            vnp_OrderType: 'billpayment',
            vnp_ReturnUrl: this.returnUrl,
            vnp_TxnRef: orderId, // Mã tham chiếu của giao dịch
            vnp_ExpireDate: vnp_ExpireDate,
        };

        // **THAY ĐỔI LỚN: Sắp xếp và tạo chuỗi hash data một cách chính xác**
        vnpParams = this.sortObject(vnpParams);

        const signData = querystring.stringify(vnpParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        vnpParams['vnp_SecureHash'] = signed;

        const paymentUrl = `${this.vnpUrl}?${querystring.stringify(vnpParams, { encode: false })}`;
        return paymentUrl;
    }

    verifyReturnUrl(vnpParams) {
        const secureHash = vnpParams['vnp_SecureHash'];

        // **THAY ĐỔI: Xóa vnp_SecureHash và vnp_SecureHashType (nếu có)**
        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        // **THAY ĐỔI LỚN: Sắp xếp và tạo chuỗi hash data để xác thực**
        const sortedParams = this.sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', this.secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash !== signed) {
            console.error('Invalid signature');
            console.log('Expected hash:', signed);
            console.log('Received hash:', secureHash);
            console.log('Sign data used for verification:', signData);
            return false; // Chữ ký không hợp lệ
        }
        
        // Chữ ký hợp lệ, kiểm tra mã phản hồi
        return vnpParams['vnp_ResponseCode'] === '00';
    }

    formatDateTime(date) {
        const pad = (num) => (num < 10 ? '0' + num : num.toString());
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }
}

module.exports = new VNPayService();