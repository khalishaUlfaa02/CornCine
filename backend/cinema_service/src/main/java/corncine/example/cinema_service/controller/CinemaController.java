package corncine.example.cinema_service.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import corncine.example.cinema_service.payload.req.CinemaReq;
import corncine.example.cinema_service.payload.res.CinemaRes;
import corncine.example.cinema_service.service.CinemaService;
import corncine.example.cinema_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    @GetMapping
    public ResponseEntity<Message> getAllCinemas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "cinemaId") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CinemaRes> result = cinemaService.getAllCinemas(pageable);

        return new ResponseEntity<>(Message.success("Daftar bioskop berhasil dimuat.", result), HttpStatus.OK);
    }

    @GetMapping("/{cinemaId}")
    public ResponseEntity<Message> getCinemaById(@PathVariable Integer cinemaId) {
        CinemaRes result = cinemaService.getCinemaById(cinemaId);
        return new ResponseEntity<>(Message.success("Detail bioskop berhasil diambil.", result), HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> createCinema(@Valid @RequestBody CinemaReq req) {
        cinemaService.createCinema(req);
        return new ResponseEntity<>(Message.success("Bioskop baru berhasil ditambahkan.", null), HttpStatus.CREATED);
    }

    @PutMapping("/{cinemaId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> updateCinema(@PathVariable Integer cinemaId, @Valid @RequestBody CinemaReq req) {
        cinemaService.updateCinema(cinemaId, req);
        return new ResponseEntity<>(Message.success("Data bioskop berhasil diperbarui.", null), HttpStatus.OK);
    }

    @DeleteMapping("/{cinemaId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> deleteCinema(@PathVariable Integer cinemaId) {
        cinemaService.deleteCinema(cinemaId);
        return new ResponseEntity<>(Message.success("Bioskop berhasil dihapus (Soft Delete).", null), HttpStatus.OK);
    }

    @PatchMapping("/{cinemaId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> toggleCinemaStatus(@PathVariable Integer cinemaId) {
        cinemaService.toggleCinemaStatus(cinemaId);
        return new ResponseEntity<>(Message.success("Status bioskop berhasil diubah.", null), HttpStatus.OK);
    }
}
