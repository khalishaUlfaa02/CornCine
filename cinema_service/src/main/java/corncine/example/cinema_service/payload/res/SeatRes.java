package corncine.example.cinema_service.payload.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatRes {
    private Integer seatId;
    private Integer studioId;
    private String seatRow;
    private Integer seatNumber;
    private String seatCode;
    private String seatType;
}
