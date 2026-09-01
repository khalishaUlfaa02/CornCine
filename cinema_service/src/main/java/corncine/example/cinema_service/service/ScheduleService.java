package corncine.example.cinema_service.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import corncine.example.cinema_service.payload.req.ScheduleReq;
import corncine.example.cinema_service.payload.res.ScheduleRes;

public interface ScheduleService {
    Page<ScheduleRes> getAllSchedules(Pageable pageable);
    ScheduleRes getScheduleById(Integer scheduleId);
    List<ScheduleRes> getSchedulesByMovieAndDate(Integer movieId, LocalDate showDate);
    List<ScheduleRes> getSchedulesByStudioAndDate(Integer studioId, LocalDate showDate);
    void createSchedule(ScheduleReq req);
    void updateSchedule(Integer scheduleId, ScheduleReq req);
    void deleteSchedule(Integer scheduleId);
}
