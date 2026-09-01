package corncine.example.cinema_service.payload.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioRes {
    private Integer studioId;
    private Integer cinemaId;
    private String cinemaName;
    private Integer studioNumber;
    private String studioType;
    private Integer totalSeats;
}
