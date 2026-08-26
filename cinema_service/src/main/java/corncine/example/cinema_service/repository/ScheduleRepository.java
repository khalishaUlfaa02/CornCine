package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.ScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<ScheduleEntity, Integer> {
    List<ScheduleEntity> findByMovie_MovieIdAndShowDate(Integer movieId, LocalDate showDate);
    List<ScheduleEntity> findByStudio_StudioIdAndShowDate(Integer studioId, LocalDate showDate);
}
