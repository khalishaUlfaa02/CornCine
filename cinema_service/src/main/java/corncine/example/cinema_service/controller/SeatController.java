package corncine.example.cinema_service.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import corncine.example.cinema_service.payload.req.SeatReq;
import corncine.example.cinema_service.payload.res.SeatRes;
import corncine.example.cinema_service.service.SeatService;
import corncine.example.cinema_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    @GetMapping("/studio/{studioId}")
    public ResponseEntity<Message> getSeatsByStudioId(@PathVariable Integer studioId) {
        List<SeatRes> result = seatService.getSeatsByStudioId(studioId);
        return new ResponseEntity<>(Message.success("Daftar kursi berhasil dimuat.", result), HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> createSeat(@Valid @RequestBody SeatReq req) {
        seatService.createSeat(req);
        return new ResponseEntity<>(Message.success("Kursi baru berhasil ditambahkan.", null), HttpStatus.CREATED);
    }

    @PostMapping("/generate/{studioId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> generateSeats(
            @PathVariable Integer studioId,
            @RequestParam(defaultValue = "5") Integer rows,
            @RequestParam(defaultValue = "10") Integer seatsPerRow,
            @RequestParam(defaultValue = "REGULAR") String seatType) {
        seatService.generateSeatsForStudio(studioId, rows, seatsPerRow, seatType);
        return new ResponseEntity<>(Message.success("Kursi berhasil di-generate untuk studio.", null), HttpStatus.CREATED);
    }

    @DeleteMapping("/{seatId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> deleteSeat(@PathVariable Integer seatId) {
        seatService.deleteSeat(seatId);
        return new ResponseEntity<>(Message.success("Kursi berhasil dihapus.", null), HttpStatus.OK);
    }
}
