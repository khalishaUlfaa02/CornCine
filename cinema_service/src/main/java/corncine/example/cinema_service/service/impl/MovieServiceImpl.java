package corncine.example.cinema_service.service.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import corncine.example.cinema_service.entity.GenreEntity;
import corncine.example.cinema_service.entity.MovieEntity;
import corncine.example.cinema_service.exception.ResourceNotFoundException;
import corncine.example.cinema_service.payload.req.MovieReq;
import corncine.example.cinema_service.payload.res.MovieRes;
import corncine.example.cinema_service.repository.GenreRepository;
import corncine.example.cinema_service.repository.MovieRepository;
import corncine.example.cinema_service.service.MovieService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService{
    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;

    private MovieRes mapToRes(MovieEntity movie) {
        List<String> genreNames = movie.getGenres().stream()
                .map(GenreEntity::getGenreName)
                .collect(Collectors.toList());

        return MovieRes.builder()
                .movieId(movie.getMovieId())
                .title(movie.getTitle())
                .synopsis(movie.getSynopsis())
                .durationMinutes(movie.getDurationMinutes())
                .posterUrl(movie.getPosterUrl())
                .trailerUrl(movie.getTrailerUrl())
                .releaseDate(movie.getReleaseDate())
                .ageRating(movie.getAgeRating())
                .genres(genreNames)
                .build();
    }

    @Override
    public Page<MovieRes> getAllMovies(String search, Pageable pageable) {
        return movieRepository.searchMovies(search, pageable).map(this::mapToRes);
    }

    @Override
    public MovieRes getMovieById(Integer movieId) {
        MovieEntity movie = movieRepository.findById(movieId)
                .filter(m -> !m.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Film tidak ditemukan dengan ID: " + movieId));
        return mapToRes(movie);
    }

    @Override
    @Transactional
    public void createMovie(MovieReq req) {
        Set<GenreEntity> genres = new HashSet<>(genreRepository.findAllById(req.getGenreIds()));

        MovieEntity movie = MovieEntity.builder()
                .title(req.getTitle())
                .synopsis(req.getSynopsis())
                .durationMinutes(req.getDurationMinutes())
                .posterUrl(req.getPosterUrl())
                .trailerUrl(req.getTrailerUrl())
                .releaseDate(req.getReleaseDate())
                .ageRating(req.getAgeRating())
                .genres(genres)
                .deleted(false)
                .build();

        movieRepository.save(movie);
    }

    @Override
    @Transactional
    public void updateMovie(Integer movieId, MovieReq req) {
        MovieEntity movie = movieRepository.findById(movieId)
                .filter(m -> !m.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Film tidak ditemukan dengan ID: " + movieId));

        Set<GenreEntity> genres = new HashSet<>(genreRepository.findAllById(req.getGenreIds()));

        movie.setTitle(req.getTitle());
        movie.setSynopsis(req.getSynopsis());
        movie.setDurationMinutes(req.getDurationMinutes());
        movie.setPosterUrl(req.getPosterUrl());
        movie.setTrailerUrl(req.getTrailerUrl());
        movie.setReleaseDate(req.getReleaseDate());
        movie.setAgeRating(req.getAgeRating());
        movie.setGenres(genres);

        movieRepository.save(movie);
    }

    @Override
    @Transactional
    public void deleteMovie(Integer movieId) {
        MovieEntity movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Film tidak ditemukan dengan ID: " + movieId));

        movie.setDeleted(true); // Soft Delete
        movieRepository.save(movie);
    }
}
