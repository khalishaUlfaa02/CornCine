package corncine.example.cinema_service.repository;

import corncine.example.cinema_service.entity.ScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<ScheduleEntity, Integer> {
    List<ScheduleEntity> findByMovie_MovieIdAndShowDate(Integer movieId, LocalDate showDate);
    List<ScheduleEntity> findByStudio_StudioIdAndShowDate(Integer studioId, LocalDate showDate);

    @Query("SELECT s FROM ScheduleEntity s WHERE s.studio.studioId = :studioId AND s.showDate = :showDate AND " +
           "((s.startTime <= :endTime AND s.endTime >= :startTime))")
    List<ScheduleEntity> findConflictingSchedules(@Param("studioId") Integer studioId,
                                                  @Param("showDate") LocalDate showDate,
                                                  @Param("startTime") LocalTime startTime,
                                                  @Param("endTime") LocalTime endTime);
}
