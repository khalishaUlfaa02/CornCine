package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.StudioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudioRepository extends JpaRepository<StudioEntity, Integer> {
    List<StudioEntity> findByCinema_CinemaId(Integer cinemaId);
}