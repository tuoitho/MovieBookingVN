const Showtime = require('../models/showtimeModel');
const Cinema = require('../models/cinemaModel');
const Movie = require('../models/movieModel');
const ApiError = require('../utils/ApiError');

class ShowtimeService {
    // Tạo suất chiếu mới
    async createShowtime(showtimeData) {
        // Kiểm tra xem phòng có trống trong khoảng thời gian này không
        const overlapping = await Showtime.checkOverlap(
            showtimeData.cinemaId,
            showtimeData.roomId,
            new Date(showtimeData.startTime),
            new Date(showtimeData.endTime)
        );

        if (overlapping) {
            throw new ApiError(400, 'Phòng đã có suất chiếu khác trong khoảng thời gian này');
        }

        // Lấy thông tin phòng từ rạp
        const cinema = await Cinema.findById(showtimeData.cinemaId);
        if (!cinema) {
            throw new ApiError(404, 'Không tìm thấy rạp');
        }

        const room = cinema.rooms.id(showtimeData.roomId);
        if (!room) {
            throw new ApiError(404, 'Không tìm thấy phòng');
        }

        // Tạo sơ đồ ghế cho suất chiếu dựa trên sơ đồ ghế của phòng
        showtimeData.seatsAvailable = room.seatLayout.map(row =>
            row.map(seat => ({
                seatNumber: seat.seatNumber,
                type: seat.type,
                status: 'available',
                price: showtimeData.price[seat.type]
            }))
        );

        const showtime = await Showtime.create(showtimeData);
        return showtime;
    }

    // Lấy danh sách suất chiếu theo bộ lọc
    async getShowtimes(filters = {}) {
        const query = {};

        if (filters.movieId) {
            query.movieId = filters.movieId;
        }

        if (filters.cinemaId) {
            query.cinemaId = filters.cinemaId;
        }

        if (filters.date) {
            const date = new Date(filters.date);
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            query.startTime = {
                $gte: date,
                $lt: nextDate
            };
        }

        const showtimes = await Showtime.find(query)
            .populate('movieId', 'title posterUrl duration')
            .populate('cinemaId', 'name')
            .sort({ startTime: 1 });

        return showtimes;
    }

    // Lấy chi tiết suất chiếu
    async getShowtimeById(showtimeId) {
        const showtime = await Showtime.findById(showtimeId)
            .populate('movieId', 'title posterUrl duration')
            .populate('cinemaId', 'name address');

        if (!showtime) {
            throw new ApiError(404, 'Không tìm thấy suất chiếu');
        }

        return showtime;
    }

    // Cập nhật suất chiếu
    async updateShowtime(showtimeId, updateData) {
        // Kiểm tra trùng lịch nếu thay đổi thời gian
        if (updateData.startTime || updateData.endTime) {
            const currentShowtime = await Showtime.findById(showtimeId);
            if (!currentShowtime) {
                throw new ApiError(404, 'Không tìm thấy suất chiếu');
            }

            const overlapping = await Showtime.checkOverlap(
                currentShowtime.cinemaId,
                currentShowtime.roomId,
                new Date(updateData.startTime || currentShowtime.startTime),
                new Date(updateData.endTime || currentShowtime.endTime),
                showtimeId
            );

            if (overlapping) {
                throw new ApiError(400, 'Phòng đã có suất chiếu khác trong khoảng thời gian này');
            }
        }

        const showtime = await Showtime.findByIdAndUpdate(
            showtimeId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!showtime) {
            throw new ApiError(404, 'Không tìm thấy suất chiếu');
        }

        return showtime;
    }

    // Xóa suất chiếu
    async deleteShowtime(showtimeId) {
        const showtime = await Showtime.findByIdAndDelete(showtimeId);
        if (!showtime) {
            throw new ApiError(404, 'Không tìm thấy suất chiếu');
        }
        return showtime;
    }

    // Lấy danh sách suất chiếu theo phim và ngày
    async getShowtimesByMovie(movieId, date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(startDate.getDate() + 1);

        const showtimes = await Showtime.find({
            movieId,
            startTime: { $gte: startDate, $lt: endDate }
        })
        .populate('cinemaId', 'name address city')
        .sort({ startTime: 1 });

        // Nhóm các suất chiếu theo rạp
        const groupedShowtimes = showtimes.reduce((acc, showtime) => {
            const cinemaId = showtime.cinemaId._id.toString();
            if (!acc[cinemaId]) {
                acc[cinemaId] = {
                    cinema: showtime.cinemaId,
                    showtimes: []
                };
            }
            acc[cinemaId].showtimes.push({
                _id: showtime._id,
                startTime: showtime.startTime,
                endTime: showtime.endTime,
                roomId: showtime.roomId,
                price: showtime.price
            });
            return acc;
        }, {});

        return Object.values(groupedShowtimes);
    }

    // Kiểm tra và cập nhật trạng thái ghế
    async checkAndUpdateSeats(showtimeId, seats) {
        const showtime = await this.getShowtimeById(showtimeId);
        
        // Kiểm tra xem các ghế có tồn tại và còn trống không
        for (const seatNumber of seats) {
            let seatFound = false;
            for (const row of showtime.seatsAvailable) {
                for (const seat of row) {
                    if (seat.seatNumber === seatNumber) {
                        seatFound = true;
                        if (seat.status !== 'available') {
                            throw new ApiError(400, `Ghế ${seatNumber} không còn trống`);
                        }
                        break;
                    }
                }
                if (seatFound) break;
            }
            if (!seatFound) {
                throw new ApiError(400, `Ghế ${seatNumber} không tồn tại`);
            }
        }

        // Cập nhật trạng thái ghế thành selected
        for (const seatNumber of seats) {
            await showtime.updateSeatStatus(seatNumber, 'selected');
        }

        return showtime;
    }
}

module.exports = new ShowtimeService(); 