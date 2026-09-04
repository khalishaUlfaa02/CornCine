package corncine.example.cinema_service.payload.res;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleRes {
    private Integer scheduleId;
    private String movieTitle;
    private String cinemaName;
    private Integer studioId;
    private Integer studioNumber;
    private String studioType;
    private LocalDate showDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal price;
}
