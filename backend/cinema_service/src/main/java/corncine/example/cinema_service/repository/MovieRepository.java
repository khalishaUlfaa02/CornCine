package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.MovieEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MovieRepository extends JpaRepository<MovieEntity, Integer> {
    @Query("SELECT m FROM MovieEntity m WHERE m.deleted = false AND " +
           "(:title IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%')))")
    Page<MovieEntity> searchMovies(@Param("title") String title, Pageable pageable);
}