package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.MovieEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<MovieEntity, Integer> {
    Page<MovieEntity> findByDeletedFalse(Pageable pageable);
}