package corncine.example.cinema_service.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import corncine.example.cinema_service.entity.CinemaEntity;
import corncine.example.cinema_service.exception.ResourceNotFoundException;
import corncine.example.cinema_service.payload.req.CinemaReq;
import corncine.example.cinema_service.payload.res.CinemaRes;
import corncine.example.cinema_service.repository.CinemaRepository;
import corncine.example.cinema_service.service.CinemaService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CinemaServiceImpl implements CinemaService {
    private final CinemaRepository cinemaRepository;

    private CinemaRes mapToRes(CinemaEntity cinema) {
        return CinemaRes.builder()
                .cinemaId(cinema.getCinemaId())
                .name(cinema.getName())
                .city(cinema.getCity())
                .address(cinema.getAddress())
                .phoneNumber(cinema.getPhoneNumber())
                .isActive(cinema.getIsActive())
                .build();
    }

    @Override
    public Page<CinemaRes> getAllCinemas(Pageable pageable) {
        return cinemaRepository.findByDeletedFalse(pageable).map(this::mapToRes);
    }

    @Override
    public CinemaRes getCinemaById(Integer cinemaId) {
        CinemaEntity cinema = cinemaRepository.findById(cinemaId)
                .filter(c -> !c.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Bioskop tidak ditemukan dengan ID: " + cinemaId));
        return mapToRes(cinema);
    }

    @Override
    @Transactional
    public void createCinema(CinemaReq req) {
        CinemaEntity cinema = CinemaEntity.builder()
                .name(req.getName())
                .city(req.getCity())
                .address(req.getAddress())
                .phoneNumber(req.getPhoneNumber())
                .isActive(true)
                .deleted(false)
                .build();

        cinemaRepository.save(cinema);
    }

    @Override
    @Transactional
    public void updateCinema(Integer cinemaId, CinemaReq req) {
        CinemaEntity cinema = cinemaRepository.findById(cinemaId)
                .filter(c -> !c.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Bioskop tidak ditemukan dengan ID: " + cinemaId));

        cinema.setName(req.getName());
        cinema.setCity(req.getCity());
        cinema.setAddress(req.getAddress());
        cinema.setPhoneNumber(req.getPhoneNumber());

        cinemaRepository.save(cinema);
    }

    @Override
    @Transactional
    public void deleteCinema(Integer cinemaId) {
        CinemaEntity cinema = cinemaRepository.findById(cinemaId)
                .orElseThrow(() -> new ResourceNotFoundException("Bioskop tidak ditemukan dengan ID: " + cinemaId));

        cinema.setDeleted(true);
        cinemaRepository.save(cinema);
    }

    @Override
    @Transactional
    public void toggleCinemaStatus(Integer cinemaId) {
        CinemaEntity cinema = cinemaRepository.findById(cinemaId)
                .filter(c -> !c.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Bioskop tidak ditemukan dengan ID: " + cinemaId));

        cinema.setIsActive(!cinema.getIsActive());
        cinemaRepository.save(cinema);
    }
}
