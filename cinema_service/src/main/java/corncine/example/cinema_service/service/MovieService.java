package corncine.example.cinema_service.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import corncine.example.cinema_service.payload.req.MovieReq;
import corncine.example.cinema_service.payload.res.MovieRes;

public interface MovieService {
    Page<MovieRes> getAllMovies(String search, Pageable pageable);
    MovieRes getMovieById(Integer movieId);
    void createMovie(MovieReq req);
    void updateMovie(Integer movieId, MovieReq req);
    void deleteMovie(Integer movieId);
}
