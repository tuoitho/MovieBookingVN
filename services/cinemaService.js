const Cinema = require('../models/cinemaModel');
const ApiError = require('../utils/ApiError');

class CinemaService {
    // Tạo rạp mới
    async createCinema(cinemaData) {
        const cinema = await Cinema.create(cinemaData);
        return cinema;
    }

    // Lấy danh sách rạp với bộ lọc
    async getCinemas(filters = {}) {
        const query = {};
        
        if (filters.city) {
            query.city = filters.city;
        }

        if (filters.search) {
            query.name = { $regex: filters.search, $options: 'i' };
        }

        const cinemas = await Cinema.find(query)
            .sort({ name: 1 });

        return cinemas;
    }

    // Lấy chi tiết một rạp
    async getCinemaById(cinemaId) {
        const cinema = await Cinema.findById(cinemaId);
        if (!cinema) {
            throw new ApiError(404, 'Không tìm thấy rạp');
        }
        return cinema;
    }

    // Cập nhật thông tin rạp
    async updateCinema(cinemaId, updateData) {
        const cinema = await Cinema.findByIdAndUpdate(
            cinemaId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!cinema) {
            throw new ApiError(404, 'Không tìm thấy rạp');
        }

        return cinema;
    }

    // Xóa rạp
    async deleteCinema(cinemaId) {
        const cinema = await Cinema.findByIdAndDelete(cinemaId);
        if (!cinema) {
            throw new ApiError(404, 'Không tìm thấy rạp');
        }
        return cinema;
    }

    // Thêm phòng mới vào rạp
    async addRoom(cinemaId, roomData) {
        const cinema = await this.getCinemaById(cinemaId);
        await cinema.addRoom(roomData);
        return cinema;
    }

    // Cập nhật thông tin phòng
    async updateRoom(cinemaId, roomId, updateData) {
        const cinema = await Cinema.findOneAndUpdate(
            { 
                _id: cinemaId,
                'rooms._id': roomId
            },
            {
                $set: {
                    'rooms.$': updateData
                }
            },
            { new: true, runValidators: true }
        );

        if (!cinema) {
            throw new ApiError(404, 'Không tìm thấy rạp hoặc phòng');
        }

        return cinema;
    }

    // Xóa phòng
    async deleteRoom(cinemaId, roomId) {
        const cinema = await Cinema.findByIdAndUpdate(
            cinemaId,
            {
                $pull: { rooms: { _id: roomId } }
            },
            { new: true }
        );

        if (!cinema) {
            throw new ApiError(404, 'Không tìm thấy rạp');
        }

        return cinema;
    }

    // Lấy thông tin một phòng cụ thể
    async getRoom(cinemaId, roomId) {
        const result = await Cinema.findRoom(cinemaId, roomId);
        if (!result) {
            throw new ApiError(404, 'Không tìm thấy phòng');
        }
        return result.rooms[0];
    }

    // Lấy danh sách rạp gần đây theo thành phố và khoảng cách
    async getNearbyCinemas(city, coordinates) {
        const query = { city };
        
        if (coordinates) {
            // Nếu có tọa độ, sắp xếp theo khoảng cách
            return await Cinema.find(query)
                .select('name address city logoUrl')
                .sort({ name: 1 });
        }
        
        return await Cinema.find(query)
            .select('name address city logoUrl')
            .sort({ name: 1 });
    }

    // Lấy lịch chiếu của rạp theo ngày
    async getCinemaSchedule(cinemaId, date) {
        const cinema = await this.getCinemaById(cinemaId);
        
        // Lấy tất cả các suất chiếu của rạp trong ngày
        // (Sẽ implement sau khi có Showtime module)
        return {
            cinema: {
                name: cinema.name,
                address: cinema.address,
                city: cinema.city
            },
            date,
            schedule: [] // Sẽ populate từ Showtime module
        };
    }

    // Lấy thông tin chi tiết phòng chiếu cho user
    async getRoomDetailsForUser(cinemaId, roomId) {
        const room = await this.getRoom(cinemaId, roomId);
        
        // Chỉ trả về thông tin cần thiết cho user
        return {
            roomName: room.roomName,
            capacity: room.capacity,
            seatTypes: this.getAvailableSeatTypes(room.seatLayout)
        };
    }

    // Helper method để lấy các loại ghế có trong phòng
    getAvailableSeatTypes(seatLayout) {
        const types = new Set();
        seatLayout.forEach(row => {
            row.forEach(seat => {
                types.add(seat.type);
            });
        });
        return Array.from(types);
    }
}

module.exports = new CinemaService(); 