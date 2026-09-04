package corncine.example.ticket_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentSimulateReq {
    @NotBlank(message = "Booking Code wajib diisi")
    private String bookingCode;

    @NotBlank(message = "Payment Method wajib diisi")
    private String paymentMethod;
}