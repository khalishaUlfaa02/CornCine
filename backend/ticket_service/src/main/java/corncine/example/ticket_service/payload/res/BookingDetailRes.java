package corncine.example.ticket_service.payload.res;

import lombok.Data;

import java.util.List;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingDetailRes {
    private String bookingCode;
    private Double totalAmount;
    private String paymentStatus;
    private String paymentCode;
    private String paymentMethod;
    private LocalDateTime bookingTime;
    
    private String movieTitle;
    private String cinemaName;
    private String studioName;
    private LocalDateTime showTime;
    
    private List<String> seatCodes;
}
