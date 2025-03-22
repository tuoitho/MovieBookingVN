# Movie Ticket Booking API

RESTful API backend for a movie ticket booking system built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Movie management (CRUD operations)
- Showtime scheduling
- Ticket booking system
- Seat management
- Payment integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/movie-ticket-booking
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST /api/auth/signup - Register new user
- POST /api/auth/login - Login user

### Movies
- GET /api/movies - Get all movies
- GET /api/movies/:id - Get movie by ID
- POST /api/movies - Create new movie (Admin)
- PATCH /api/movies/:id - Update movie (Admin)
- DELETE /api/movies/:id - Delete movie (Admin)

### Showtimes
- GET /api/showtimes - Get all showtimes
- GET /api/showtimes/:id - Get showtime by ID
- POST /api/showtimes - Create new showtime (Admin)
- PATCH /api/showtimes/:id - Update showtime (Admin)
- DELETE /api/showtimes/:id - Delete showtime (Admin)

### Bookings
- GET /api/bookings - Get all bookings (Admin)
- GET /api/bookings/my-bookings - Get user's bookings
- POST /api/bookings - Create new booking
- PATCH /api/bookings/:id/status - Update booking status
- PATCH /api/bookings/:id/payment - Update payment status

## Authentication

All protected routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:
```json
{
  "status": "fail",
  "message": "Error message"
}
```