package corncine.example.cinema_service.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import corncine.example.cinema_service.payload.req.ScheduleReq;
import corncine.example.cinema_service.payload.res.ScheduleRes;
import corncine.example.cinema_service.service.ScheduleService;
import corncine.example.cinema_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<Message> getAllSchedules(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "showDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ScheduleRes> result = scheduleService.getAllSchedules(pageable);

        return new ResponseEntity<>(Message.success("Daftar jadwal berhasil dimuat.", result), HttpStatus.OK);
    }

    @GetMapping("/{scheduleId}")
    public ResponseEntity<Message> getScheduleById(@PathVariable Integer scheduleId) {
        ScheduleRes result = scheduleService.getScheduleById(scheduleId);
        return new ResponseEntity<>(Message.success("Detail jadwal berhasil diambil.", result), HttpStatus.OK);
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<Message> getSchedulesByMovie(
            @PathVariable Integer movieId,
            @RequestParam LocalDate date) {
        List<ScheduleRes> result = scheduleService.getSchedulesByMovieAndDate(movieId, date);
        return new ResponseEntity<>(Message.success("Jadwal film berhasil dimuat.", result), HttpStatus.OK);
    }

    @GetMapping("/studio/{studioId}")
    public ResponseEntity<Message> getSchedulesByStudio(
            @PathVariable Integer studioId,
            @RequestParam LocalDate date) {
        List<ScheduleRes> result = scheduleService.getSchedulesByStudioAndDate(studioId, date);
        return new ResponseEntity<>(Message.success("Jadwal studio berhasil dimuat.", result), HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Message> createSchedule(@Valid @RequestBody ScheduleReq req) {
        scheduleService.createSchedule(req);
        return new ResponseEntity<>(Message.success("Jadwal baru berhasil ditambahkan.", null), HttpStatus.CREATED);
    }

    @PutMapping("/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Message> updateSchedule(@PathVariable Integer scheduleId, @Valid @RequestBody ScheduleReq req) {
        scheduleService.updateSchedule(scheduleId, req);
        return new ResponseEntity<>(Message.success("Jadwal berhasil diperbarui.", null), HttpStatus.OK);
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> deleteSchedule(@PathVariable Integer scheduleId) {
        scheduleService.deleteSchedule(scheduleId);
        return new ResponseEntity<>(Message.success("Jadwal berhasil dihapus.", null), HttpStatus.OK);
    }
}
