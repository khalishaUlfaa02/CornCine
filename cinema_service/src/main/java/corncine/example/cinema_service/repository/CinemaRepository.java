package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.CinemaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CinemaRepository extends JpaRepository<CinemaEntity, Integer> {
    Page<CinemaEntity> findByDeletedFalse(Pageable pageable);
}
