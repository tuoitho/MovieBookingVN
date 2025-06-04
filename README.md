# Movie Booking VN - Backend

Backend API service for the Tuổi Thơ Movie Booking VN platform, built with Node.js, Express, and MongoDB. It handles user authentication, movie listings, cinema information, showtimes, bookings, reviews, promotions, and payment gateway integrations.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Directory Structure](#directory-structure)
- [API Endpoints](#api-endpoints)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Contributing](#contributing)
- [License](#license)

## Features

-   **User Authentication**: Secure registration, login, profile management, JWT-based sessions, password reset.
-   **Movie Management**: CRUD operations for movies, fetching now showing, coming soon, search by title/genre.
-   **Cinema Management**: CRUD operations for cinemas and their rooms, fetching nearby cinemas, cinema schedules.
-   **Showtime Management**: CRUD operations for showtimes, fetching by movie/cinema/date, real-time seat availability.
-   **Booking System**: Create bookings, view user's booking history, cancel bookings, handle booking expiration.
-   **Payment Integration**: Support for VNPay, Momo, and ZaloPay (callbacks handled).
-   **Review System**: Users can post, update, and delete reviews for movies.
-   **Promotion System**: Admin can create and manage promotions; users can apply valid promotion codes.
-   **Role-Based Access Control**: Differentiated access for Users and Admins.
-   **Security**: Helmet for security headers, CORS, rate limiting, input validation.
-   **Logging**: Request logging with Morgan and custom colored console logging.
-   **Email Notifications**: For actions like email verification, password reset, booking confirmation (via Nodemailer).

## Technologies Used

-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB with Mongoose ODM
-   **Authentication**: JSON Web Tokens (JWT), bcryptjs
-   **API Security**: Helmet, CORS, express-rate-limit
-   **Validation**: Joi, express-validator
-   **File Uploads**: Multer (dependency listed, usage not shown in provided files but good to note)
-   **Payment**: Nodemailer (for email), VNPay integration (custom service)
-   **Utilities**: dotenv, slugify, winston (dependency listed, custom logger used)
-   **Development**: Nodemon
-   **Testing**: Jest, Supertest

## Directory Structure

```
tuoitho-moviebookingvn/
├── package.json            # Project dependencies and scripts
├── server.js               # Main entry point, Express server setup
├── controllers/            # Request handlers, business logic interface
│   ├── authController.js
│   ├── bookingController.js
│   ├── cinemaController.js
│   ├── movieController.js
│   ├── promotionController.js
│   ├── reviewController.js
│   └── showtimeController.js
├── middlewares/            # Custom Express middlewares
│   ├── authMiddleware.js     # JWT authentication and authorization
│   └── errorMiddleware.js    # Error handling
├── models/                 # Mongoose schemas and models
│   ├── bookingModel.js
│   ├── cinemaModel.js
│   ├── movieModel.js
│   ├── promotionModel.js
│   ├── reviewModel.js
│   ├── showtimeModel.js
│   └── userModel.js
├── routes/                 # API route definitions
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── cinemaRoutes.js
│   ├── movieRoutes.js
│   ├── promotionRoutes.js
│   ├── reviewRoutes.js
│   └── showtimeRoutes.js
├── services/               # Business logic, interacts with models
│   ├── bookingService.js
│   ├── cinemaService.js
│   ├── emailService.js
│   ├── movieService.js
│   ├── promotionService.js
│   ├── reviewService.js
│   ├── showtimeService.js
│   └── vnpayService.js
└── utils/                  # Utility functions and classes
    ├── ApiError.js         # Custom API error class
    ├── catchAsync.js       # Wrapper for async route handlers
    ├── generateToken.js    # JWT generation utilities
    ├── logger.js           # Custom console logger setup
    └── validation.js       # Joi validation schemas
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication (`/auth`)

-   `POST /register`: Register a new user.
-   `POST /login`: Login an existing user.
-   `POST /forgotpassword`: Request a password reset.
-   `PUT /resetpassword/:resettoken`: Reset password using a token.
-   `GET /me`: (Protected) Get current logged-in user's details.
-   `PUT /updatedetails`: (Protected) Update current user's details (fullName, phoneNumber).

### Movies (`/movies`)

-   `POST /`: (Admin) Create a new movie.
-   `GET /`: Get all movies with filtering, sorting, and pagination.
    -   Query Params: `status`, `genre`, `search`, `page`, `limit`, `sort`
-   `GET /search`: Search movies by keyword.
    -   Query Params: `query`
-   `GET /now-showing`: Get movies currently showing.
-   `GET /coming-soon`: Get upcoming movies.
-   `GET /slug/:slug`: Get a single movie by its slug.
-   `GET /:id`: Get a single movie by its ID.
-   `PUT /:id`: (Admin) Update a movie.
-   `DELETE /:id`: (Admin) Delete a movie.

### Reviews (nested under Movies & standalone for user-specific operations)

-   `POST /movies/:movieId/reviews`: (Protected) Create a review for a movie.
-   `GET /movies/:movieId/reviews`: Get all reviews for a specific movie.
-   `GET /movies/:movieId/my-review`: (Protected) Get the current user's review for a specific movie.
-   `PUT /reviews/:reviewId`: (Protected) Update a specific review (user must own the review).
-   `DELETE /reviews/:reviewId`: (Protected) Delete a specific review (user must own the review).
-   `GET /users/me/reviews`: (Protected) Get all reviews made by the current user. (Note: This route is defined in `reviewController.js` and `reviewRoutes.js` but not explicitly mounted under `/users` in `server.js`. Assuming it's intended to be `/api/v1/reviews/me/reviews` if `reviewRoutes.js` is mounted at `/api/v1/reviews`.)

### Cinemas (`/cinemas`)

-   `POST /`: (Admin) Create a new cinema.
-   `GET /`: Get all cinemas.
    -   Query Params: `city`, `search`
-   `GET /nearby`: Get nearby cinemas.
    -   Query Params: `city`, `lat`, `lng`
-   `GET /:id`: Get details of a specific cinema.
-   `PUT /:id`: (Admin) Update a cinema.
-   `DELETE /:id`: (Admin) Delete a cinema.
-   `POST /:cinemaId/rooms`: (Admin) Add a new room to a cinema.
-   `PUT /:cinemaId/rooms/:roomId`: (Admin) Update a room in a cinema.
-   `DELETE /:cinemaId/rooms/:roomId`: (Admin) Delete a room from a cinema.
-   `GET /:cinemaId/schedule`: Get the schedule for a cinema.
    -   Query Params: `date`
-   `GET /:cinemaId/rooms/:roomId`: Get details of a specific room (for user view).

### Showtimes (`/showtimes`)

-   `POST /`: (Admin) Create a new showtime.
-   `GET /`: Get all showtimes.
    -   Query Params: `movieId`, `cinemaId`, `date`
-   `GET /:id`: Get details of a specific showtime.
-   `PUT /:id`: (Admin) Update a showtime.
-   `DELETE /:id`: (Admin) Delete a showtime.
-   `GET /movie/:movieId`: Get showtimes for a specific movie.
    -   Query Params: `date`
-   `PATCH /:showtimeId/seats`: (Protected) Check and update seat status (e.g., mark as selected by user).

### Bookings (`/bookings`)

-   `POST /`: (Protected) Create a new booking.
-   `GET /my-bookings`: (Protected) Get all bookings for the current user.
    -   Query Params: `status`
-   `GET /:id`: (Protected) Get details of a specific booking.
-   `PATCH /:id/cancel`: (Protected) Cancel a booking.
-   `GET /vnpay/payment-return`: VNPay payment callback URL.
-   `POST /payment/momo/callback`: Momo payment callback URL.
-   `POST /payment/zalopay/callback`: ZaloPay payment callback URL.
-   `POST /cron/handle-expired`: (Requires API Key/Special Auth) Endpoint for a cron job to handle expired bookings.

### Promotions (`/promotions`)

-   `POST /`: (Admin) Create a new promotion.
-   `GET /`: (Admin) Get all promotions.
    -   Query Params: `page`, `limit`, `isActive`, `startDate`, `endDate`, `discountType`
-   `GET /:id`: (Admin) Get details of a specific promotion.
-   `PUT /:id`: (Admin) Update a promotion.
-   `DELETE /:id`: (Admin) Delete a promotion.
-   `POST /apply`: Apply a promotion code to an order.
    -   Body: `code`, `orderValue`, `movieId` (optional), `showtimeId` (optional)
-   `POST /:id/validate`: Validate a promotion for an order.
    -   Body: `orderValue`, `movieId` (optional), `showtimeId` (optional)
-   `POST /:id/increment-usage`: (Admin) Increment the usage count of a promotion.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd tuoitho-moviebookingvn
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    Copy the contents of `.env.example` (if provided) or create a new `.env` file in the root directory.
    ```
    touch .env
    ```

4.  **Set up Environment Variables:**
    Add the necessary environment variables to your `.env` file (see [Environment Variables](#environment-variables) section below).

## Environment Variables

Create a `.env` file in the root of your project and add the following variables:

```env
NODE_ENV=development # development or production
PORT=5000
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d # e.g., 30d, 1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key # If using refresh tokens
REFRESH_TOKEN_EXPIRES_IN=60d # e.g., 60d

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000

# Email (Nodemailer SMTP)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@example.com
FROM_NAME="Tuổi Thơ Movie Booking"

# VNPay
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html # VNPay payment URL (sandbox or production)
VNPAY_RETURN_URL=http://localhost:5000/api/v1/bookings/vnpay/payment-return # Your backend return URL

# Add other payment gateway variables if needed (Momo, ZaloPay)
# E.g., MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, etc.
```

## Running the Project

-   **Development mode (with Nodemon for auto-restarts):**
    ```bash
    npm run dev
    ```

-   **Production mode:**
    ```bash
    npm start
    ```

-   **Run tests:**
    ```bash
    npm test
    ```

The server will start on the port specified in your `.env` file (default is 5000).

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the existing coding style and all tests pass.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details (if applicable, or specify your license).
```
