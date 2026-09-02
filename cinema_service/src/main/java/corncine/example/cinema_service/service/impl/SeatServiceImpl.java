package corncine.example.cinema_service.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import corncine.example.cinema_service.entity.SeatEntity;
import corncine.example.cinema_service.entity.StudioEntity;
import corncine.example.cinema_service.exception.ResourceNotFoundException;
import corncine.example.cinema_service.payload.req.SeatReq;
import corncine.example.cinema_service.payload.res.SeatRes;
import corncine.example.cinema_service.repository.SeatRepository;
import corncine.example.cinema_service.repository.StudioRepository;
import corncine.example.cinema_service.service.SeatService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SeatServiceImpl implements SeatService {
    private final SeatRepository seatRepository;
    private final StudioRepository studioRepository;

    private SeatRes mapToRes(SeatEntity seat) {
        return SeatRes.builder()
                .seatId(seat.getSeatId())
                .studioId(seat.getStudio().getStudioId())
                .seatRow(seat.getSeatRow())
                .seatNumber(seat.getSeatNumber())
                .seatCode(seat.getSeatCode())
                .seatType(seat.getSeatType())
                .build();
    }

    @Override
    public List<SeatRes> getSeatsByStudioId(Integer studioId) {
        studioRepository.findById(studioId)
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + studioId));

        return seatRepository.findByStudio_StudioIdOrderBySeatRowAscSeatNumberAsc(studioId).stream()
                .map(this::mapToRes)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createSeat(SeatReq req) {
        StudioEntity studio = studioRepository.findById(req.getStudioId())
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + req.getStudioId()));

        String seatCode = req.getSeatRow() + req.getSeatNumber();

        SeatEntity seat = SeatEntity.builder()
                .studio(studio)
                .seatRow(req.getSeatRow())
                .seatNumber(req.getSeatNumber())
                .seatCode(seatCode)
                .seatType(req.getSeatType() != null ? req.getSeatType() : "REGULAR")
                .build();

        seatRepository.save(seat);
    }

    @Override
    @Transactional
    public void updateSeat(Integer seatId, SeatReq req) {
        SeatEntity seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new ResourceNotFoundException("Kursi tidak ditemukan dengan ID: " + seatId));

        StudioEntity studio = studioRepository.findById(req.getStudioId())
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + req.getStudioId()));

        String seatCode = req.getSeatRow() + req.getSeatNumber();

        seat.setStudio(studio);
        seat.setSeatRow(req.getSeatRow());
        seat.setSeatNumber(req.getSeatNumber());
        seat.setSeatCode(seatCode);
        seat.setSeatType(req.getSeatType() != null ? req.getSeatType() : "REGULAR");

        seatRepository.save(seat);
    }

    @Override
    @Transactional
    public void generateSeatsForStudio(Integer studioId, Integer rows, Integer seatsPerRow, String seatType) {
        StudioEntity studio = studioRepository.findById(studioId)
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + studioId));

        List<SeatEntity> seats = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            String rowLabel = String.valueOf((char) ('A' + r));
            for (int s = 1; s <= seatsPerRow; s++) {
                SeatEntity seat = SeatEntity.builder()
                        .studio(studio)
                        .seatRow(rowLabel)
                        .seatNumber(s)
                        .seatCode(rowLabel + s)
                        .seatType(seatType != null ? seatType : "REGULAR")
                        .build();
                seats.add(seat);
            }
        }

        seatRepository.saveAll(seats);

        studio.setTotalSeats(rows * seatsPerRow);
        studioRepository.save(studio);
    }

    @Override
    @Transactional
    public void deleteSeat(Integer seatId) {
        SeatEntity seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new ResourceNotFoundException("Kursi tidak ditemukan dengan ID: " + seatId));
        seatRepository.delete(seat);
    }
}
