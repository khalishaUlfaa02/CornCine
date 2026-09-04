package corncine.example.cinema_service.controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.RestController;

import corncine.example.cinema_service.payload.req.GenreReq;
import corncine.example.cinema_service.payload.res.GenreRes;
import corncine.example.cinema_service.service.GenreService;
import corncine.example.cinema_service.utility.Message;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreService genreService;

    @GetMapping
    public ResponseEntity<Message> getAllGenres() {
        List<GenreRes> result = genreService.getAllGenres();
        return new ResponseEntity<>(Message.success("Daftar genre berhasil dimuat.", result), HttpStatus.OK);
    }

    @GetMapping("/{genreId}")
    public ResponseEntity<Message> getGenreById(@PathVariable Integer genreId) {
        GenreRes result = genreService.getGenreById(genreId);
        return new ResponseEntity<>(Message.success("Detail genre berhasil diambil.", result), HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Message> createGenre(@Valid @RequestBody GenreReq req) {
        genreService.createGenre(req);
        return new ResponseEntity<>(Message.success("Genre baru berhasil ditambahkan.", null), HttpStatus.CREATED);
    }

    @PutMapping("/{genreId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Message> updateGenre(@PathVariable Integer genreId, @Valid @RequestBody GenreReq req) {
        genreService.updateGenre(genreId, req);
        return new ResponseEntity<>(Message.success("Genre berhasil diperbarui.", null), HttpStatus.OK);
    }

    @DeleteMapping("/{genreId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> deleteGenre(@PathVariable Integer genreId) {
        genreService.deleteGenre(genreId);
        return new ResponseEntity<>(Message.success("Genre berhasil dihapus.", null), HttpStatus.OK);
    }
}
