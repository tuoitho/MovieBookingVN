#  Xây Dựng Ứng Dụng Web Đặt Vé Xem Phim Bằng MERN Stack

**Mục tiêu chính:** Phát triển một ứng dụng web đặt vé xem phim hoàn chỉnh, trực quan và dễ sử dụng, sử dụng MERN stack (MongoDB, Express.js, React.js, Node.js). Ứng dụng phải có đầy đủ các chức năng cho cả người dùng thông thường và quản trị viên.

**Yêu cầu chung:**
* **Ngôn ngữ:** Sử dụng tiếng Việt cho tất cả nội dung hiển thị trên giao diện người dùng.
* **Mã nguồn:** Cung cấp mã nguồn hoàn chỉnh, được tổ chức tốt, dễ hiểu và có comment giải thích chi tiết cho từng phần (backend, frontend, database schemas).
* **Best Practices:** Tuân thủ các phương pháp hay nhất về bảo mật (ví dụ: mã hóa mật khẩu, bảo vệ API), hiệu suất, khả năng mở rộng và cấu trúc thư mục.
* **Responsive Design:** Giao diện người dùng phải tương thích tốt trên các thiết bị khác nhau (desktop, tablet, mobile).

---

## Phần 1: Thiết Kế Cơ Sở Dữ Liệu (MongoDB & Mongoose)

Vui lòng thiết kế và định nghĩa các Mongoose Schema cho các collection sau. Hãy đảm bảo có các chỉ mục (indexes) cần thiết để tối ưu hóa truy vấn và xác định rõ ràng mối quan hệ giữa các collection.

### 1.1. `User` Collection
* **Mục đích:** Lưu trữ thông tin tài khoản người dùng.
* **Schema Fields:**
    * `fullName`: (Kiểu `String`, bắt buộc) - Họ và tên người dùng.
    * `email`: (Kiểu `String`, bắt buộc, duy nhất, có validate định dạng email) - Địa chỉ email.
    * `password`: (Kiểu `String`, bắt buộc) - Mật khẩu (sẽ được mã hóa bằng bcrypt trước khi lưu).
    * `phoneNumber`: (Kiểu `String`, tùy chọn, duy nhất, có validate định dạng số điện thoại Việt Nam) - Số điện thoại.
    * `avatar`: (Kiểu `String`, tùy chọn, URL ảnh đại diện, có giá trị mặc định nếu không cung cấp).
    * `role`: (Kiểu `String`, `enum` bao gồm `['user', 'admin']`, mặc định là `'user'`) - Vai trò người dùng.
    * `emailVerified`: (Kiểu `Boolean`, mặc định `false`) - Trạng thái xác thực email.
    * `verificationToken`: (Kiểu `String`, tùy chọn) - Token dùng để xác thực email.
    * `resetPasswordToken`: (Kiểu `String`, tùy chọn) - Token dùng để reset mật khẩu.
    * `resetPasswordExpires`: (Kiểu `Date`, tùy chọn) - Thời gian hết hạn của token reset mật khẩu.
    * `createdAt`, `updatedAt`: (Kiểu `Date`, tự động tạo bởi `timestamps: true`).

### 1.2. `Movie` Collection
* **Mục đích:** Lưu trữ thông tin chi tiết về các bộ phim.
* **Schema Fields:**
    * `title`: (Kiểu `String`, bắt buộc, duy nhất) - Tên phim.
    * `vietnameseTitle`: (Kiểu `String`, tùy chọn) - Tên phim tiếng Việt.
    * `description`: (Kiểu `String`, bắt buộc) - Mô tả chi tiết nội dung phim.
    * `posterUrl`: (Kiểu `String`, bắt buộc, URL ảnh poster chính của phim).
    * `bannerUrl`: (Kiểu `String`, tùy chọn, URL ảnh banner/cover lớn của phim).
    * `trailerUrl`: (Kiểu `String`, bắt buộc, URL trailer phim, ví dụ: YouTube embed URL).
    * `duration`: (Kiểu `Number`, bắt buộc) - Thời lượng phim tính bằng phút.
    * `releaseDate`: (Kiểu `Date`, bắt buộc) - Ngày phát hành.
    * `endDate`: (Kiểu `Date`, tùy chọn) - Ngày kết thúc chiếu.
    * `genre`: (Kiểu `[String]`, bắt buộc, mảng các thể loại phim, ví dụ: `['Hành động', 'Phiêu lưu']`).
    * `director`: (Kiểu `String`, tùy chọn) - Đạo diễn.
    * `actors`: (Kiểu `[String]`, tùy chọn) - Danh sách diễn viên.
    * `language`: (Kiểu `String`, bắt buộc) - Ngôn ngữ phim (ví dụ: 'Tiếng Anh - Phụ đề Tiếng Việt').
    * `rating`: (Kiểu `String`, tùy chọn, ví dụ: 'P', 'C13', 'C16', 'C18') - Phân loại độ tuổi.
    * `status`: (Kiểu `String`, `enum` bao gồm `['now_showing', 'coming_soon', 'ended']`, mặc định là `'coming_soon'`) - Trạng thái phim.
    * `averageRating`: (Kiểu `Number`, mặc định `0`, từ 1 đến 5) - Điểm đánh giá trung bình (tính từ `Review` collection).
    * `totalReviews`: (Kiểu `Number`, mặc định `0`) - Tổng số lượt đánh giá.
    * `slug`: (Kiểu `String`, duy nhất, tự động tạo từ `title` để dùng cho URL thân thiện).
    * `createdAt`, `updatedAt`: (Kiểu `Date`, tự động tạo bởi `timestamps: true`).

### 1.3. `Cinema` Collection (Rạp chiếu phim)
* **Mục đích:** Lưu trữ thông tin về các cụm rạp và phòng chiếu.
* **Schema Fields:**
    * `name`: (Kiểu `String`, bắt buộc, duy nhất) - Tên cụm rạp (ví dụ: "CGV Vincom Bà Triệu").
    * `address`: (Kiểu `String`, bắt buộc) - Địa chỉ cụm rạp.
    * `city`: (Kiểu `String`, bắt buộc) - Thành phố.
    * `logoUrl`: (Kiểu `String`, tùy chọn) - URL logo của cụm rạp.
    * `rooms`: (Kiểu `[RoomSchema]`) - Danh sách các phòng chiếu trong cụm rạp.
        * **`RoomSchema` (Schema con):**
            * `roomName`: (Kiểu `String`, bắt buộc) - Tên phòng chiếu (ví dụ: "Phòng 1", "IMAX").
            * `seatLayout`: (Kiểu `[[SeatSchema]]`, bắt buộc) - Mảng 2 chiều đại diện cho sơ đồ ghế.
                * **`SeatSchema` (Schema con):**
                    * `seatNumber`: (Kiểu `String`, ví dụ: "A1", "B5").
                    * `type`: (Kiểu `String`, `enum` bao gồm `['standard', 'vip', 'couple']`, mặc định `'standard'`).
                    * `isBooked`: (Kiểu `Boolean`, mặc định `false`) - Trạng thái ghế đã được đặt cho một suất chiếu cụ thể (sẽ được quản lý ở `Showtime`).
            * `capacity`: (Kiểu `Number`, bắt buộc) - Sức chứa của phòng.
    * `createdAt`, `updatedAt`: (Kiểu `Date`, tự động tạo bởi `timestamps: true`).

### 1.4. `Showtime` Collection (Suất chiếu)
* **Mục đích:** Lưu trữ thông tin các suất chiếu của một bộ phim tại một phòng chiếu cụ thể.
* **Schema Fields:**
    * `movieId`: (Kiểu `ObjectId`, tham chiếu đến `Movie` collection, bắt buộc).
    * `cinemaId`: (Kiểu `ObjectId`, tham chiếu đến `Cinema` collection, bắt buộc).
    * `roomId`: (Kiểu `String`, bắt buộc) - ID của phòng chiếu trong `Cinema` (có thể là `_id` của `RoomSchema` nếu nó được lưu như một subdocument có ID, hoặc một định danh duy nhất khác).
    * `startTime`: (Kiểu `Date`, bắt buộc) - Thời gian bắt đầu chiếu.
    * `endTime`: (Kiểu `Date`, bắt buộc) - Thời gian kết thúc chiếu (tự động tính dựa trên `startTime` và `movie.duration`).
    * `price`: (Kiểu `Object`, bắt buộc) - Giá vé cho các loại ghế:
        * `standard`: (Kiểu `Number`, bắt buộc).
        * `vip`: (Kiểu `Number`, bắt buộc).
        * `couple`: (Kiểu `Number`, bắt buộc).
    * `seatsAvailable`: (Kiểu `[[ShowtimeSeatSchema]]`, bắt buộc) - Bản sao của `seatLayout` từ `Room` tại thời điểm tạo suất chiếu, với trạng thái đặt chỗ cho suất chiếu này.
        * **`ShowtimeSeatSchema` (Schema con):**
            * `seatNumber`: (Kiểu `String`).
            * `type`: (Kiểu `String`).
            * `status`: (Kiểu `String`, `enum` bao gồm `['available', 'booked', 'unavailable', 'selected']`, mặc định `'available'`). `selected` dùng cho frontend khi người dùng đang chọn.
            * `price`: (Kiểu `Number`) - Giá của ghế này cho suất chiếu này.
    * `createdAt`, `updatedAt`: (Kiểu `Date`, tự động tạo bởi `timestamps: true`).

### 1.5. `Booking` Collection (Đặt vé)
* **Mục đích:** Lưu trữ thông tin về các lần đặt vé của người dùng.
* **Schema Fields:**
    * `userId`: (Kiểu `ObjectId`, tham chiếu đến `User` collection, bắt buộc).
    * `showtimeId`: (Kiểu `ObjectId`, tham chiếu đến `Showtime` collection, bắt buộc).
    * `seatsBooked`: (Kiểu `[BookedSeatSchema]`, bắt buộc) - Mảng các ghế đã đặt.
        * **`BookedSeatSchema` (Schema con):**
            * `seatNumber`: (Kiểu `String`).
            * `type`: (Kiểu `String`).
            * `price`: (Kiểu `Number`).
    * `totalPrice`: (Kiểu `Number`, bắt buộc) - Tổng giá trị đơn đặt vé.
    * `paymentMethod`: (Kiểu `String`, ví dụ: "Credit Card", "MoMo", "ZaloPay", "Cash_at_counter").
    * `paymentStatus`: (Kiểu `String`, `enum` bao gồm `['pending', 'paid', 'failed', 'refunded']`, mặc định `'pending'`).
    * `paymentIntentId`: (Kiểu `String`, tùy chọn) - ID từ cổng thanh toán (ví dụ: Stripe).
    * `bookingCode`: (Kiểu `String`, duy nhất, tự động tạo) - Mã đặt vé để người dùng check-in.
    * `qrCodeUrl`: (Kiểu `String`, tùy chọn) - URL của QR code chứa `bookingCode`.
    * `notes`: (Kiểu `String`, tùy chọn) - Ghi chú thêm.
    * `createdAt`, `updatedAt`: (Kiểu `Date`, tự động tạo bởi `timestamps: true`).

### 1.6. `Review` Collection (Đánh giá phim)
* **Mục đích:** Lưu trữ đánh giá và bình luận của người dùng về phim.
* **Schema Fields:**
    * `userId`: (Kiểu `ObjectId`, tham chiếu đến `User` collection, bắt buộc).
    * `movieId`: (Kiểu `ObjectId`, tham chiếu đến `Movie` collection, bắt buộc).
    * `rating`: (Kiểu `Number`, bắt buộc, từ 1 đến 5).
    * `comment`: (Kiểu `String`, tùy chọn).
    * `createdAt`, `updatedAt`: (Kiểu `Date`, tự động tạo bởi `timestamps: true`).
    * **Constraint:** Một người dùng chỉ được đánh giá một phim một lần.

### 1.7. `Promotion` Collection (Khuyến mãi)
* **Mục đích:** Lưu trữ thông tin về các chương trình khuyến mãi, mã giảm giá.
* **Schema Fields:**
    * `code`: (Kiểu `String`, bắt buộc, duy nhất) - Mã khuyến mãi.
    * `description`: (Kiểu `String`, bắt buộc) - Mô tả chương trình.
    * `discountType`: (Kiểu `String`, `enum` bao gồm `['percentage', 'fixed_amount']`, bắt buộc).
    * `discountValue`: (Kiểu `Number`, bắt buộc).
    * `startDate`: (Kiểu `Date`, bắt buộc).
    * `endDate`: (Kiểu `Date`, bắt buộc).
    * `usageLimit`: (Kiểu `Number`, tùy chọn) - Số lần sử dụng tối đa.
    * `timesUsed`: (Kiểu `Number`, mặc định `0`).
    * `isActive`: (Kiểu `Boolean`, mặc định `true`).
    * `minOrderValue`: (Kiểu `Number`, tùy chọn) - Giá trị đơn hàng tối thiểu để áp dụng.
    * `applicableMovies`: (Kiểu `[ObjectId]`, tham chiếu đến `Movie`, tùy chọn) - Áp dụng cho phim cụ thể.
    * `applicableShowtimes`: (Kiểu `[ObjectId]`, tham chiếu đến `Showtime`, tùy chọn) - Áp dụng cho suất chiếu cụ thể.
    * `createdAt`, `updatedAt`: (Kiểu `Date`, tự động tạo bởi `timestamps: true`).

---

## Phần 2: Xây Dựng Backend (Node.js & Express.js)

Xây dựng các API endpoint theo cấu trúc RESTful. Tổ chức mã nguồn theo mô hình: `config`, `controllers`, `models`, `routes`, `middlewares`, `utils`, `services`.

### 2.1. Cấu trúc thư mục Backend gợi ý:

/backend
/config           // Cấu hình (database, environment variables)
/controllers      // Logic xử lý request
/middlewares      // Middlewares (auth, error handling, validation)
/models           // Mongoose schemas
/routes           // Định nghĩa các API routes
/services         // Logic nghiệp vụ phức tạp (ví dụ: payment service, email service)
/utils            // Các hàm tiện ích (ví dụ: generate token, hash password)
.env
server.js         // Điểm khởi chạy server
package.json


### 2.2. Authentication Module (`/api/v1/auth`)
* `POST /register`: Đăng ký người dùng mới (hash mật khẩu, gửi email xác thực).
* `POST /login`: Đăng nhập (kiểm tra thông tin, trả về JWT access token và refresh token).
* `POST /logout`: Đăng xuất (nếu sử dụng refresh token, có thể vô hiệu hóa nó).
* `GET /verify-email?token=<token>`: Xác thực email người dùng.
* `POST /refresh-token`: Cấp mới access token từ refresh token.
* `POST /forgot-password`: Gửi email chứa link reset mật khẩu.
* `POST /reset-password?token=<token>`: Đặt lại mật khẩu mới.
* `GET /me`: Lấy thông tin người dùng đang đăng nhập (yêu cầu JWT).
* `PUT /me/update-profile`: Cập nhật thông tin cá nhân (tên, số điện thoại, avatar).
* `PUT /me/change-password`: Thay đổi mật khẩu.

### 2.3. Movie Module (`/api/v1/movies`)
* **Admin Routes (yêu cầu `isAdmin` middleware):**
    * `POST /`: Thêm phim mới.
    * `PUT /:id`: Cập nhật thông tin phim.
    * `DELETE /:id`: Xóa một phim.
* **Public Routes:**
    * `GET /`: Lấy danh sách tất cả phim (hỗ trợ phân trang, lọc theo `status`, `genre`, `releaseDate`, tìm kiếm theo `title`).
    * `GET /slug/:slug`: Lấy thông tin chi tiết của một phim bằng slug.
    * `GET /:id`: Lấy thông tin chi tiết của một phim bằng ID.
    * `GET /:id/reviews`: Lấy danh sách đánh giá của một phim (phân trang).
    * `POST /:id/reviews`: Thêm đánh giá mới cho phim (yêu cầu `auth` middleware).

### 2.4. Cinema Module (`/api/v1/cinemas`)
* **Admin Routes (yêu cầu `isAdmin` middleware):**
    * `POST /`: Thêm cụm rạp mới.
    * `PUT /:id`: Cập nhật thông tin cụm rạp.
    * `DELETE /:id`: Xóa cụm rạp.
    * `POST /:cinemaId/rooms`: Thêm phòng chiếu mới vào cụm rạp.
    * `PUT /:cinemaId/rooms/:roomId`: Cập nhật phòng chiếu.
    * `DELETE /:cinemaId/rooms/:roomId`: Xóa phòng chiếu.
* **Public Routes:**
    * `GET /`: Lấy danh sách tất cả cụm rạp (hỗ trợ lọc theo thành phố).
    * `GET /:id`: Lấy thông tin chi tiết một cụm rạp (bao gồm danh sách phòng chiếu).

### 2.5. Showtime Module (`/api/v1/showtimes`)
* **Admin Routes (yêu cầu `isAdmin` middleware):**
    * `POST /`: Tạo một suất chiếu mới (tự động tính `endTime`, tạo `seatsAvailable` dựa trên `Room.seatLayout` và `price`).
    * `PUT /:id`: Cập nhật thông tin suất chiếu.
    * `DELETE /:id`: Xóa một suất chiếu.
* **Public Routes:**
    * `GET /`: Lấy danh sách tất cả các suất chiếu (hỗ trợ lọc theo `movieId`, `cinemaId`, `date`).
    * `GET /by-movie/:movieId`: Lấy tất cả suất chiếu của một bộ phim cụ thể trong một khoảng thời gian (ví dụ: 7 ngày tới), nhóm theo rạp và ngày.
    * `GET /:id`: Lấy thông tin chi tiết của một suất chiếu (bao gồm sơ đồ ghế `seatsAvailable`).

### 2.6. Booking Module (`/api/v1/bookings`)
* **User Routes (yêu cầu `auth` middleware):**
    * `POST /`: Tạo một đơn đặt vé mới (khởi tạo với `paymentStatus: 'pending'`, giữ chỗ tạm thời trong `Showtime.seatsAvailable` bằng cách đánh dấu là `'selected'` hoặc có cơ chế khóa ghế tạm thời).
    * `POST /create-payment-intent`: (Nếu dùng Stripe/cổng thanh toán) Tạo một yêu cầu thanh toán cho đơn đặt vé đã tạo ở trên. Trả về `clientSecret` cho frontend.
    * `POST /confirm-payment/:bookingId`: Xác nhận thanh toán thành công (có thể là webhook từ cổng thanh toán hoặc frontend gọi sau khi thanh toán thành công). Cập nhật `Booking.paymentStatus` thành `'paid'`, `Showtime.seatsAvailable` các ghế tương ứng thành `'booked'`, gửi email xác nhận đặt vé kèm QR code.
    * `GET /my-bookings`: Lấy lịch sử đặt vé của người dùng đang đăng nhập (phân trang).
    * `GET /my-bookings/:bookingId`: Lấy chi tiết một đơn đặt vé của người dùng.
    * `POST /cancel/:bookingId`: Yêu cầu hủy vé (nếu chính sách cho phép, xử lý hoàn tiền nếu cần).
* **Admin Routes (yêu cầu `isAdmin` middleware):**
    * `GET /`: Lấy danh sách tất cả đơn đặt vé (hỗ trợ lọc, phân trang).
    * `GET /:id`: Lấy chi tiết một đơn đặt vé.
    * `PUT /:id/status`: Cập nhật trạng thái đơn đặt vé (ví dụ: xác nhận thủ công, xử lý refund).

### 2.7. Promotion Module (`/api/v1/promotions`)
* **Admin Routes (yêu cầu `isAdmin` middleware):**
    * `POST /`: Tạo mã khuyến mãi mới.
    * `PUT /:id`: Cập nhật mã khuyến mãi.
    * `DELETE /:id`: Xóa mã khuyến mãi.
    * `GET /`: Lấy danh sách tất cả mã khuyến mãi.
* **User Routes (yêu cầu `auth` middleware):**
    * `POST /apply`: Người dùng nhập mã khuyến mãi để kiểm tra và áp dụng vào đơn hàng (trước khi thanh toán). Backend sẽ kiểm tra tính hợp lệ (còn hạn, còn lượt sử dụng, giá trị đơn hàng tối thiểu,...) và trả về giá trị giảm giá.

### 2.8. Yêu cầu kỹ thuật Backend khác:
* **Middleware:**
    * `authMiddleware`: Xác thực JWT, gắn `req.user`.
    * `adminMiddleware`: Kiểm tra `req.user.role === 'admin'`.
    * `validationMiddleware`: Sử dụng thư viện như `express-validator` hoặc `joi` để validate dữ liệu đầu vào cho các request.
    * `errorHandlerMiddleware`: Middleware xử lý lỗi tập trung, trả về lỗi theo format JSON chuẩn.
    * `notFoundMiddleware`: Xử lý các route không tồn tại.
* **Bảo mật:**
    * Sử dụng `dotenv` để quản lý biến môi trường.
    * Mã hóa mật khẩu bằng `bcryptjs`.
    * Sử dụng `jsonwebtoken` cho access token và refresh token (HTTPOnly cookie cho refresh token).
    * Sử dụng `helmet` để bảo vệ khỏi các lỗ hổng web phổ biến.
    * Sử dụng `cors` để cấu hình Cross-Origin Resource Sharing.
    * Rate limiting (ví dụ: `express-rate-limit`) để chống brute-force.
* **Email Service:** Tích hợp gửi email (ví dụ: `nodemailer` với SendGrid, Mailgun) cho các chức năng: xác thực email, quên mật khẩu, thông báo đặt vé thành công.
* **File Uploads (cho poster, avatar):** Sử dụng `multer` và lưu trữ trên cloud (Cloudinary, AWS S3) hoặc local server.
* **Logging:** Sử dụng `morgan` cho HTTP request logging và `winston` hoặc `pino` cho application logging.
* **API Documentation:** (Tùy chọn) Sử dụng Swagger/OpenAPI để tự động tạo tài liệu API.

---

## Phần 3: Xây Dựng Frontend (React.js)

Xây dựng giao diện người dùng hiện đại, tương tác, và responsive.

### 3.1. Cấu trúc thư mục Frontend gợi ý:

/frontend
/src
/api             // Hàm gọi API (sử dụng Axios)
/assets          // Hình ảnh, fonts, svgs
/components      // Components tái sử dụng (UI primitives, layout components)
/common        // Nút, input, modal,...
/layout        // Navbar, Footer, Sidebar,...
/movie         // MovieCard, MovieList,...
/booking       // SeatSelector, BookingSummary,...
/config          // Cấu hình frontend (API base URL)
/contexts        // React Context API (AuthContext, ThemeContext)
/hooks           // Custom React Hooks
/pages           // Các trang chính của ứng dụng
/routes          // Định nghĩa routes (sử dụng React Router DOM)
/store           // Redux Toolkit store (nếu sử dụng)
/styles          // Global styles, theme
/utils           // Các hàm tiện ích frontend
App.js
index.js
public/
package.json


### 3.2. Các Trang (Pages) chính:
* **Trang Chủ (`/`):**
    * Banner/Carousel hiển thị các phim nổi bật (poster lớn, trailer).
    * Danh sách "Phim đang chiếu" và "Phim sắp chiếu" (sử dụng `MovieCard`).
    * Bộ lọc phim nhanh (theo thể loại, rạp).
    * Thanh tìm kiếm phim theo tên.
* **Trang Danh Sách Phim (`/movies`):**
    * Hiển thị tất cả phim với bộ lọc chi tiết (thể loại, ngày chiếu, trạng thái, rạp chiếu) và phân trang.
* **Trang Chi Tiết Phim (`/movie/:slug` hoặc `/movie/:id`):**
    * Hiển thị đầy đủ thông tin phim: poster, banner, trailer (có thể play inline), mô tả, đạo diễn, diễn viên, thời lượng, thể loại, đánh giá (rating).
    * Tab/Section hiển thị các suất chiếu có sẵn cho phim này:
        * Lọc suất chiếu theo ngày, theo cụm rạp.
        * Hiển thị danh sách suất chiếu (giờ chiếu, loại phòng).
    * Tab/Section đánh giá phim: hiển thị các đánh giá từ người dùng, form để người dùng đã đăng nhập và đã xem phim có thể gửi đánh giá.
* **Trang Chọn Ghế & Đặt Vé (`/booking/:showtimeId`):**
    * Hiển thị thông tin suất chiếu (tên phim, rạp, phòng, giờ chiếu).
    * Sơ đồ ghế ngồi (`SeatSelector` component) tương tác:
        * Hiển thị các loại ghế (thường, VIP, đôi) với màu sắc khác nhau.
        * Hiển thị trạng thái ghế (trống, đã đặt, đang chọn).
        * Người dùng nhấp để chọn/bỏ chọn ghế (có giới hạn số ghế tối đa mỗi lần đặt).
        * Hiển thị chú giải các loại ghế và trạng thái.
    * Tóm tắt đơn hàng: danh sách ghế đã chọn, tổng tiền (tự động cập nhật).
    * Ô nhập mã khuyến mãi.
    * Nút "Tiếp tục" hoặc "Thanh toán".
* **Trang Thanh Toán (`/checkout/:bookingId`):**
    * Tóm tắt lại thông tin đơn hàng.
    * Lựa chọn phương thức thanh toán (Thẻ tín dụng qua Stripe, MoMo, ZaloPay, Thanh toán tại quầy).
    * Form nhập thông tin thanh toán (ví dụ: Stripe Elements).
    * Nút "Xác nhận thanh toán".
* **Trang Xác Nhận Đặt Vé Thành Công (`/booking-success/:bookingId`):**
    * Hiển thị thông báo đặt vé thành công.
    * Hiển thị mã đặt vé và QR code.
    * Thông tin chi tiết vé đã đặt.
    * Nút "Xem vé của tôi" hoặc "Về trang chủ".
* **Trang Tài Khoản Người Dùng (`/profile`):**
    * Tab "Thông tin cá nhân": hiển thị và cho phép chỉnh sửa thông tin (tên, email, SĐT, avatar), đổi mật khẩu.
    * Tab "Lịch sử đặt vé": danh sách các vé đã đặt, trạng thái vé, chi tiết vé.
* **Trang Đăng Nhập (`/login`) & Đăng Ký (`/register`).**
* **Trang Quên Mật Khẩu (`/forgot-password`) & Đặt Lại Mật Khẩu (`/reset-password/:token`).**
* **Trang Quản Trị (Admin Dashboard - `/admin` - yêu cầu `AdminRoute`):**
    * **Tổng Quan:** Thống kê nhanh (số người dùng, số phim, số vé bán, doanh thu).
    * **Quản Lý Phim (`/admin/movies`):**
        * Danh sách phim (CRUD - Tạo, Đọc, Cập nhật, Xóa).
        * Form thêm/sửa phim chi tiết.
    * **Quản Lý Rạp Chiếu (`/admin/cinemas`):**
        * Danh sách cụm rạp (CRUD).
        * Form thêm/sửa cụm rạp, quản lý phòng chiếu và sơ đồ ghế cho từng phòng.
    * **Quản Lý Suất Chiếu (`/admin/showtimes`):**
        * Danh sách suất chiếu (CRUD).
        * Form thêm/sửa suất chiếu (chọn phim, rạp, phòng, giờ, giá vé).
    * **Quản Lý Đặt Vé (`/admin/bookings`):**
        * Danh sách tất cả đơn đặt vé (lọc, tìm kiếm, xem chi tiết).
        * Cập nhật trạng thái thanh toán (nếu cần).
    * **Quản Lý Người Dùng (`/admin/users`):**
        * Danh sách người dùng (xem thông tin, thay đổi vai trò, khóa/mở khóa tài khoản).
    * **Quản Lý Khuyến Mãi (`/admin/promotions`):**
        * Danh sách mã khuyến mãi (CRUD).
    * **Quản Lý Đánh Giá (`/admin/reviews`):**
        * Danh sách đánh giá (xem, xóa).

### 3.3. Components Tái Sử Dụng Quan Trọng:
* `Navbar`: Thanh điều hướng chính (logo, link trang chủ, phim, rạp, đăng nhập/đăng ký, profile user, admin dashboard link).
* `Footer`: Thông tin cuối trang.
* `MovieCard`: Hiển thị thông tin tóm tắt phim (poster, tên, thể loại, nút "Mua vé").
* `SeatSelector`: Component tương tác hiển thị sơ đồ ghế và cho phép chọn ghế.
* `ProtectedRoute`: Wrapper component để bảo vệ các trang yêu cầu đăng nhập.
* `AdminRoute`: Wrapper component để bảo vệ các trang quản trị.
* `LoadingSpinner`/`SkeletonLoader`: Hiển thị khi tải dữ liệu.
* `Modal`: Component modal chung.
* `Pagination`: Component phân trang.
* `SearchBar`: Component thanh tìm kiếm.
* `DatePicker`: Component chọn ngày.
* `TimePicker`: Component chọn giờ.
* `ImageUploader`: Component tải ảnh lên.

### 3.4. Yêu cầu kỹ thuật Frontend khác:
* **State Management:** Sử dụng **Redux Toolkit** (khuyến khích cho ứng dụng lớn) hoặc **React Context API** kết hợp `useReducer` cho các trạng thái phức tạp (ví dụ: trạng thái giỏ hàng/đặt vé, trạng thái người dùng).
* **Routing:** Sử dụng **React Router DOM v6+** (sử dụng `createBrowserRouter`, `Outlet`, `loader`, `action` nếu có thể).
* **API Calls:** Sử dụng **Axios** để tạo các instance gọi API có cấu hình sẵn (ví dụ: `baseURL`, tự động đính kèm JWT vào header `Authorization: Bearer <token>`). Xử lý interceptor cho request và response (ví dụ: tự động refresh token).
* **UI Framework/Library:** Sử dụng **Tailwind CSS** (khuyến khích vì tính tùy biến cao)
* **Form Handling:** Sử dụng **React Hook Form** hoặc **Formik** để quản lý form và validation hiệu quả. Validation schema với `Yup` hoặc `Zod`.
* **Notifications/Toasts:** Sử dụng thư viện như `react-toastify` hoặc `react-hot-toast` để hiển thị thông báo.
* **Lazy Loading:** Áp dụng lazy loading cho các trang và components để cải thiện thời gian tải ban đầu (sử dụng `React.lazy` và `Suspense`).
* **SEO:** (Cơ bản) Sử dụng `react-helmet-async` để quản lý thẻ `<title>`, `<meta>` cho các trang.
* **Real-time (Tùy chọn, nâng cao):** Cân nhắc sử dụng Socket.IO hoặc Pusher để cập nhật trạng thái ghế trống theo thời gian thực khi nhiều người dùng cùng đặt vé cho một suất chiếu.

---

## Phần 4: Quy Trình Phát Triển và Triển Khai

### 4.1. Quy trình phát triển gợi ý:
1.  **Setup dự án:** Tạo cấu trúc thư mục cho backend và frontend, cài đặt các dependencies cần thiết.
2.  **Database Design & Models:** Triển khai các Mongoose schemas.
3.  **Backend API Development:**
    * Authentication module.
    * Movie, Cinema, Showtime modules (CRUD cho admin trước, sau đó public endpoints).
    * Booking module.
    * Promotion module.
    * Viết unit tests và integration tests (ví dụ: Jest, Supertest).
4.  **Frontend Development:**
    * Setup routing, layout cơ bản (Navbar, Footer).
    * Auth pages (Login, Register) và tích hợp với Auth API.
    * Trang chủ, trang danh sách phim, chi tiết phim.
    * Quy trình đặt vé (chọn ghế, thanh toán).
    * Trang người dùng.
    * Admin dashboard.
    * Viết component tests và end-to-end tests (ví dụ: Jest, React Testing Library, Cypress).
5.  **Tích hợp & Kiểm thử:** Kiểm thử toàn bộ luồng người dùng và luồng admin.
6.  **Tối ưu hóa:** Tối ưu hiệu suất backend (query optimization, caching) và frontend (code splitting, image optimization).

### 4.2. Triển khai (Deployment):
* **Backend:** Heroku, AWS EC2, Google Cloud Run, DigitalOcean Droplets. Sử dụng PM2 để quản lý process Node.js.
* **Frontend:** Vercel, Netlify, AWS S3/CloudFront, GitHub Pages.
* **Database:** MongoDB Atlas (cloud-hosted).
* **CI/CD:** (Tùy chọn) Thiết lập pipeline CI/CD sử dụng GitHub Actions, Jenkins, GitLab CI.

---

**Câu hỏi làm rõ (nếu AI cần):**
* Bạn có ưu tiên cụ thể nào về thư viện UI (Tailwind, MUI, AntD) không?
* Cổng thanh toán cụ thể nào bạn muốn tích hợp (Stripe, PayPal, MoMo, ZaloPay)? Nếu không, có thể giả lập quy trình thanh toán.
* Có yêu cầu đặc biệt nào về tính năng real-time (ví dụ: cập nhật ghế trống) không?

Vui lòng bắt đầu bằng việc thiết lập cấu trúc thư mục cho cả backend và frontend, sau đó triển khai từng phần theo thứ tự đã nêu. Cung cấp mã nguồn rõ ràng, có comment giải thích cho từng module và chức năng.
