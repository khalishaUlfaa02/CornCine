package corncine.example.cinema_service.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import corncine.example.cinema_service.payload.req.CinemaReq;
import corncine.example.cinema_service.payload.res.CinemaRes;

public interface CinemaService {
    Page<CinemaRes> getAllCinemas(Pageable pageable);
    CinemaRes getCinemaById(Integer cinemaId);
    void createCinema(CinemaReq req);
    void updateCinema(Integer cinemaId, CinemaReq req);
    void deleteCinema(Integer cinemaId);
    void toggleCinemaStatus(Integer cinemaId);
}
