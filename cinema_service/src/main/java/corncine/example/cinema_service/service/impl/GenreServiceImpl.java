package corncine.example.cinema_service.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import corncine.example.cinema_service.entity.GenreEntity;
import corncine.example.cinema_service.exception.ResourceNotFoundException;
import corncine.example.cinema_service.payload.req.GenreReq;
import corncine.example.cinema_service.payload.res.GenreRes;
import corncine.example.cinema_service.repository.GenreRepository;
import corncine.example.cinema_service.service.GenreService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {
    private final GenreRepository genreRepository;

    private GenreRes mapToRes(GenreEntity genre) {
        return GenreRes.builder()
                .genreId(genre.getGenreId())
                .genreName(genre.getGenreName())
                .build();
    }

    @Override
    public List<GenreRes> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::mapToRes)
                .collect(Collectors.toList());
    }

    @Override
    public GenreRes getGenreById(Integer genreId) {
        GenreEntity genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new ResourceNotFoundException("Genre tidak ditemukan dengan ID: " + genreId));
        return mapToRes(genre);
    }

    @Override
    @Transactional
    public void createGenre(GenreReq req) {
        genreRepository.findByGenreNameIgnoreCase(req.getGenreName())
                .ifPresent(g -> {
                    throw new RuntimeException("Genre dengan nama '" + req.getGenreName() + "' sudah ada.");
                });

        GenreEntity genre = GenreEntity.builder()
                .genreName(req.getGenreName())
                .build();

        genreRepository.save(genre);
    }

    @Override
    @Transactional
    public void updateGenre(Integer genreId, GenreReq req) {
        GenreEntity genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new ResourceNotFoundException("Genre tidak ditemukan dengan ID: " + genreId));

        genreRepository.findByGenreNameIgnoreCase(req.getGenreName())
                .filter(g -> !g.getGenreId().equals(genreId))
                .ifPresent(g -> {
                    throw new RuntimeException("Genre dengan nama '" + req.getGenreName() + "' sudah ada.");
                });

        genre.setGenreName(req.getGenreName());
        genreRepository.save(genre);
    }

    @Override
    @Transactional
    public void deleteGenre(Integer genreId) {
        GenreEntity genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new ResourceNotFoundException("Genre tidak ditemukan dengan ID: " + genreId));
        genreRepository.delete(genre);
    }
}
