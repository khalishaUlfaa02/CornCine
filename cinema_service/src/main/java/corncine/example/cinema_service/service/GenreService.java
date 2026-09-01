package corncine.example.cinema_service.service;

import java.util.List;
import corncine.example.cinema_service.payload.req.GenreReq;
import corncine.example.cinema_service.payload.res.GenreRes;

public interface GenreService {
    List<GenreRes> getAllGenres();
    GenreRes getGenreById(Integer genreId);
    void createGenre(GenreReq req);
    void updateGenre(Integer genreId, GenreReq req);
    void deleteGenre(Integer genreId);
}
