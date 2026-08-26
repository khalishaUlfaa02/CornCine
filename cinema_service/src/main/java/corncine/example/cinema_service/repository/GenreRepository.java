package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.GenreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<GenreEntity, Integer> {
    Optional<GenreEntity> findByGenreNameIgnoreCase(String genreName);
}