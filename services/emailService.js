const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Send verification email
exports.sendVerificationEmail = async (email, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Email Verification',
        html: `
            <h1>Verify Your Email</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
        `
    };

    await transporter.sendMail(message);
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h1>Reset Your Password</h1>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 10 minutes.</p>
        `
    };

    await transporter.sendMail(message);
};

// Send booking confirmation email
exports.sendBookingConfirmationEmail = async (email, booking) => {
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: 'Booking Confirmation',
        html: `
            <h1>Booking Confirmation</h1>
            <p>Your booking has been confirmed!</p>
            <h2>Booking Details:</h2>
            <p>Booking Code: ${booking.bookingCode}</p>
            <p>Movie: ${booking.showtime.movie.title}</p>
            <p>Cinema: ${booking.showtime.cinema.name}</p>
            <p>Date: ${new Date(booking.showtime.startTime).toLocaleString()}</p>
            <p>Seats: ${booking.seatsBooked.map(seat => seat.seatNumber).join(', ')}</p>
            <p>Total Price: ${booking.totalPrice} VND</p>
            <img src="${booking.qrCodeUrl}" alt="QR Code" />
        `
    };

    await transporter.sendMail(message);
}; 