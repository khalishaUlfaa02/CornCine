package corncine.example.ticket_service.payload.res;

import lombok.Data;

import java.util.List;

@Data
public class BookingRes {
    private String bookingCode;
    private Double totalAmount;
    private String paymentStatus;
    private String paymentCode;
    // String agar mendukung ID integer cinema ("1") maupun UUID lama
    private List<String> seats;
}
