package corncine.example.ticket_service.payload.res;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BookingRes {
    private String bookingCode;
    private Double totalAmount;
    private String paymentStatus;
    private String paymentCode;
    private List<UUID> seats;
}
