package corncine.example.cinema_service.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import corncine.example.cinema_service.entity.CinemaEntity;
import corncine.example.cinema_service.entity.StudioEntity;
import corncine.example.cinema_service.exception.ResourceNotFoundException;
import corncine.example.cinema_service.payload.req.StudioReq;
import corncine.example.cinema_service.payload.res.StudioRes;
import corncine.example.cinema_service.repository.CinemaRepository;
import corncine.example.cinema_service.repository.StudioRepository;
import corncine.example.cinema_service.service.StudioService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StudioServiceImpl implements StudioService {
    private final StudioRepository studioRepository;
    private final CinemaRepository cinemaRepository;

    private StudioRes mapToRes(StudioEntity studio) {
        return StudioRes.builder()
                .studioId(studio.getStudioId())
                .cinemaId(studio.getCinema().getCinemaId())
                .cinemaName(studio.getCinema().getName())
                .studioNumber(studio.getStudioNumber())
                .studioType(studio.getStudioType())
                .totalSeats(studio.getTotalSeats())
                .build();
    }

    @Override
    public List<StudioRes> getStudiosByCinemaId(Integer cinemaId) {
        cinemaRepository.findById(cinemaId)
                .filter(c -> !c.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Bioskop tidak ditemukan dengan ID: " + cinemaId));

        return studioRepository.findByCinema_CinemaId(cinemaId).stream()
                .map(this::mapToRes)
                .collect(Collectors.toList());
    }

    @Override
    public StudioRes getStudioById(Integer studioId) {
        StudioEntity studio = studioRepository.findById(studioId)
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + studioId));
        return mapToRes(studio);
    }

    @Override
    @Transactional
    public void createStudio(StudioReq req) {
        CinemaEntity cinema = cinemaRepository.findById(req.getCinemaId())
                .filter(c -> !c.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Bioskop tidak ditemukan dengan ID: " + req.getCinemaId()));

        StudioEntity studio = StudioEntity.builder()
                .cinema(cinema)
                .studioNumber(req.getStudioNumber())
                .studioType(req.getStudioType())
                .totalSeats(req.getTotalSeats())
                .build();

        studioRepository.save(studio);
    }

    @Override
    @Transactional
    public void updateStudio(Integer studioId, StudioReq req) {
        StudioEntity studio = studioRepository.findById(studioId)
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + studioId));

        CinemaEntity cinema = cinemaRepository.findById(req.getCinemaId())
                .filter(c -> !c.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Bioskop tidak ditemukan dengan ID: " + req.getCinemaId()));

        studio.setCinema(cinema);
        studio.setStudioNumber(req.getStudioNumber());
        studio.setStudioType(req.getStudioType());
        studio.setTotalSeats(req.getTotalSeats());

        studioRepository.save(studio);
    }

    @Override
    @Transactional
    public void deleteStudio(Integer studioId) {
        StudioEntity studio = studioRepository.findById(studioId)
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + studioId));
        studioRepository.delete(studio);
    }
}
