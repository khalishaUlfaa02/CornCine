package corncine.example.ticket_service.payload.res;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PaymentSimulateRes {
    private String bookingCode;
    private Double totalAmount;
    private String paymentStatus;
    private String paymentMethod;
    private LocalDateTime paymentTime;
}