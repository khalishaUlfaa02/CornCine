package corncine.example.ticket_service.payload.res;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValidateTicketRes {
    private String bookingCode;
    private String movieTitle;
    private String cinemaName;
    private String studioName;
    private String showTime;
    private String seatCodes;
}
