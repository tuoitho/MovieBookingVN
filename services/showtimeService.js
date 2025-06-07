const Showtime = require('../models/showtimeModel');
const Cinema = require('../models/cinemaModel');
const Movie = require('../models/movieModel');
const ApiError = require('../utils/ApiError');

class ShowtimeService {
    // Helper để validate và parse date
    _parseDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new ApiError(400, 'Định dạng ngày không hợp lệ');
        }
        return date;
    }

    // Tạo suất chiếu mới
    async createShowtime(showtimeData) {
        try {
            // Validate và parse startTime
            if (!showtimeData.startTime) {
                throw new ApiError(400, 'Vui lòng chọn thời gian bắt đầu');
            }
            
            const startTime = this._parseDate(showtimeData.startTime);
            
            // Kiểm tra xem thời gian bắt đầu có nằm trong khoảng thời gian của suất chiếu nào không
            const overlap = await Showtime.checkOverlap(
                showtimeData.cinemaId,
                showtimeData.roomId,
                startTime
            );

            if (overlap) {
                const overlappingShowtime = overlap.overlappingShowtime;
                throw new ApiError(400, 
                    `Không thể tạo suất chiếu vì thời gian bắt đầu nằm trong khoảng thời gian của suất chiếu phim "${overlappingShowtime.movie}" ` +
                    `(${new Date(overlappingShowtime.startTime).toLocaleString('vi-VN')} - ${new Date(overlappingShowtime.endTime).toLocaleString('vi-VN')})`
                );
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
            const seatsAvailable = room.seatLayout.map(row =>
                row.map(seat => ({
                    seatNumber: seat.seatNumber,
                    type: seat.type,
                    status: 'available',
                    price: showtimeData.price[seat.type]
                }))
            );

            // Tạo showtime với dữ liệu đã được validate
            const showtime = await Showtime.create({
                ...showtimeData,
                startTime,
                seatsAvailable
            });

            return showtime;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(400, 'Dữ liệu suất chiếu không hợp lệ: ' + error.message);
        }
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
            try {
                const date = this._parseDate(filters.date);
                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);

                query.startTime = {
                    $gte: date,
                    $lt: nextDate
                };
            } catch (error) {
                throw new ApiError(400, 'Định dạng ngày không hợp lệ');
            }
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
        try {
            // Validate startTime nếu được cung cấp
            if (updateData.startTime) {
                updateData.startTime = this._parseDate(updateData.startTime);

                const currentShowtime = await Showtime.findById(showtimeId);
                if (!currentShowtime) {
                    throw new ApiError(404, 'Không tìm thấy suất chiếu');
                }

                // Kiểm tra trùng lịch với startTime mới
                const overlap = await Showtime.checkOverlap(
                    currentShowtime.cinemaId,
                    currentShowtime.roomId,
                    updateData.startTime,
                    showtimeId
                );

                if (overlap) {
                    const overlappingShowtime = overlap.overlappingShowtime;
                    throw new ApiError(400, 
                        `Không thể cập nhật vì thời gian bắt đầu mới nằm trong khoảng thời gian của suất chiếu phim "${overlappingShowtime.movie}" ` +
                        `(${new Date(overlappingShowtime.startTime).toLocaleString('vi-VN')} - ${new Date(overlappingShowtime.endTime).toLocaleString('vi-VN')})`
                    );
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
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(400, 'Dữ liệu cập nhật không hợp lệ: ' + error.message);
        }
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
        try {
            const startDate = this._parseDate(date);
            const endDate = new Date(startDate);
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
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(400, 'Lỗi khi lấy danh sách suất chiếu: ' + error.message);
        }
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
        }        // Các ghế hợp lệ và có sẵn - không cần cập nhật trạng thái
        // Việc track ghế được chọn được thực hiện qua socket và selectedBy array

        return showtime;
    }

    // Cập nhật trạng thái của một ghế cụ thể
    async updateSeatStatus(showtimeId, seatNumber, status) {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
            throw new ApiError(404, 'Không tìm thấy suất chiếu');
        }

        let seatFound = false;
        
        // Tìm và cập nhật ghế trong seatsAvailable
        for (const row of showtime.seatsAvailable) {
            for (const seat of row) {
                if (seat.seatNumber === seatNumber) {
                    seat.status = status;
                    seatFound = true;
                    break;
                }
            }
            if (seatFound) break;
        }

        if (!seatFound) {
            throw new ApiError(400, `Ghế ${seatNumber} không tồn tại`);
        }

        // Lưu thay đổi
        await showtime.save();
        return showtime;
    }
}

module.exports = new ShowtimeService();