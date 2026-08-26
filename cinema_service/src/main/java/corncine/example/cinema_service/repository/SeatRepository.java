package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.SeatEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SeatRepository extends JpaRepository<SeatEntity, Integer> {
    List<SeatEntity> findByStudio_StudioIdOrderBySeatRowAscSeatNumberAsc(Integer studioId);
}
