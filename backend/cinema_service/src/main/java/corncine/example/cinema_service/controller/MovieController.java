package corncine.example.cinema_service.controller;

import corncine.example.cinema_service.payload.req.MovieReq;
import corncine.example.cinema_service.payload.res.MovieRes;
import corncine.example.cinema_service.service.MovieService;
import corncine.example.cinema_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    // Akses: Publik (Siapa saja bisa melihat katalog)
    @GetMapping
    public ResponseEntity<Message> getAllMovies(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(defaultValue = "movieId") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MovieRes> result = movieService.getAllMovies(search, pageable);

        return new ResponseEntity<>(Message.success("Katalog film berhasil dimuat", result), HttpStatus.OK);
    }

    // Akses: Publik
    @GetMapping("/{movieId}")
    public ResponseEntity<Message> getMovieById(@PathVariable Integer movieId) {
        MovieRes movie = movieService.getMovieById(movieId);
        return new ResponseEntity<>(Message.success("Detail film berhasil diambil", movie), HttpStatus.OK);
    }

    // Akses: Hanya ADMIN atau STAFF
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Message> createMovie(@Valid @RequestBody MovieReq req) {
        movieService.createMovie(req);
        return new ResponseEntity<>(Message.success("Film baru berhasil ditambahkan.", null), HttpStatus.CREATED);
    }

    // Akses: Hanya ADMIN atau STAFF
    @PutMapping("/{movieId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Message> updateMovie(@PathVariable Integer movieId, @Valid @RequestBody MovieReq req) {
        movieService.updateMovie(movieId, req);
        return new ResponseEntity<>(Message.success("Data film berhasil diperbarui.", null), HttpStatus.OK);
    }

    // Akses: HANYA ADMIN
    @DeleteMapping("/{movieId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> deleteMovie(@PathVariable Integer movieId) {
        movieService.deleteMovie(movieId);
        return new ResponseEntity<>(Message.success("Film berhasil dihapus (Soft Delete).", null), HttpStatus.OK);
    }
}