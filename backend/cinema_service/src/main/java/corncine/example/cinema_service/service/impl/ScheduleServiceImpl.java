package corncine.example.cinema_service.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import corncine.example.cinema_service.entity.MovieEntity;
import corncine.example.cinema_service.entity.ScheduleEntity;
import corncine.example.cinema_service.entity.StudioEntity;
import corncine.example.cinema_service.exception.ResourceNotFoundException;
import corncine.example.cinema_service.payload.req.ScheduleReq;
import corncine.example.cinema_service.payload.res.ScheduleRes;
import corncine.example.cinema_service.repository.MovieRepository;
import corncine.example.cinema_service.repository.ScheduleRepository;
import corncine.example.cinema_service.repository.StudioRepository;
import corncine.example.cinema_service.service.ScheduleService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final MovieRepository movieRepository;
    private final StudioRepository studioRepository;

    private ScheduleRes mapToRes(ScheduleEntity schedule) {
        return ScheduleRes.builder()
                .scheduleId(schedule.getScheduleId())
                .movieTitle(schedule.getMovie().getTitle())
                .cinemaName(schedule.getStudio().getCinema().getName())
                .studioId(schedule.getStudio().getStudioId())
                .studioNumber(schedule.getStudio().getStudioNumber())
                .studioType(schedule.getStudio().getStudioType())
                .showDate(schedule.getShowDate())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .price(schedule.getPrice())
                .build();
    }

    @Override
    public Page<ScheduleRes> getAllSchedules(Pageable pageable) {
        return scheduleRepository.findAll(pageable).map(this::mapToRes);
    }

    @Override
    public ScheduleRes getScheduleById(Integer scheduleId) {
        ScheduleEntity schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Jadwal tidak ditemukan dengan ID: " + scheduleId));
        return mapToRes(schedule);
    }

    @Override
    public List<ScheduleRes> getSchedulesByMovieAndDate(Integer movieId, LocalDate showDate) {
        return scheduleRepository.findByMovie_MovieIdAndShowDate(movieId, showDate).stream()
                .map(this::mapToRes)
                .collect(Collectors.toList());
    }

    @Override
    public List<ScheduleRes> getSchedulesByStudioAndDate(Integer studioId, LocalDate showDate) {
        return scheduleRepository.findByStudio_StudioIdAndShowDate(studioId, showDate).stream()
                .map(this::mapToRes)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createSchedule(ScheduleReq req) {
        MovieEntity movie = movieRepository.findById(req.getMovieId())
                .filter(m -> !m.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Film tidak ditemukan dengan ID: " + req.getMovieId()));

        StudioEntity studio = studioRepository.findById(req.getStudioId())
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + req.getStudioId()));

        LocalTime endTime = req.getStartTime().plusMinutes(movie.getDurationMinutes());

        // Validasi konflik jadwal
        List<ScheduleEntity> conflicts = scheduleRepository.findConflictingSchedules(
                studio.getStudioId(), req.getShowDate(), req.getStartTime(), endTime);
        
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Terdapat konflik jadwal pada studio dan waktu tersebut.");
        }

        ScheduleEntity schedule = ScheduleEntity.builder()
                .movie(movie)
                .studio(studio)
                .showDate(req.getShowDate())
                .startTime(req.getStartTime())
                .endTime(endTime)
                .price(req.getPrice())
                .build();

        scheduleRepository.save(schedule);
    }

    @Override
    @Transactional
    public void updateSchedule(Integer scheduleId, ScheduleReq req) {
        ScheduleEntity schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Jadwal tidak ditemukan dengan ID: " + scheduleId));

        MovieEntity movie = movieRepository.findById(req.getMovieId())
                .filter(m -> !m.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Film tidak ditemukan dengan ID: " + req.getMovieId()));

        StudioEntity studio = studioRepository.findById(req.getStudioId())
                .orElseThrow(() -> new ResourceNotFoundException("Studio tidak ditemukan dengan ID: " + req.getStudioId()));

        LocalTime endTime = req.getStartTime().plusMinutes(movie.getDurationMinutes());

        // Validasi konflik jadwal, kecualikan jadwal yang sedang diupdate
        List<ScheduleEntity> conflicts = scheduleRepository.findConflictingSchedules(
                studio.getStudioId(), req.getShowDate(), req.getStartTime(), endTime);
        
        boolean hasConflict = conflicts.stream().anyMatch(c -> !c.getScheduleId().equals(scheduleId));
        if (hasConflict) {
            throw new RuntimeException("Terdapat konflik jadwal pada studio dan waktu tersebut.");
        }

        schedule.setMovie(movie);
        schedule.setStudio(studio);
        schedule.setShowDate(req.getShowDate());
        schedule.setStartTime(req.getStartTime());
        schedule.setEndTime(endTime);
        schedule.setPrice(req.getPrice());

        scheduleRepository.save(schedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(Integer scheduleId) {
        ScheduleEntity schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Jadwal tidak ditemukan dengan ID: " + scheduleId));
        scheduleRepository.delete(schedule);
    }
}
