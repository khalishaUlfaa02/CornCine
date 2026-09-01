package corncine.example.cinema_service.service;

import java.util.List;
import corncine.example.cinema_service.payload.req.SeatReq;
import corncine.example.cinema_service.payload.res.SeatRes;

public interface SeatService {
    List<SeatRes> getSeatsByStudioId(Integer studioId);
    void createSeat(SeatReq req);
    void generateSeatsForStudio(Integer studioId, Integer rows, Integer seatsPerRow, String seatType);
    void deleteSeat(Integer seatId);
}
