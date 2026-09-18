package corncine.example.ticket_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class XenditInvoiceReq {
    @NotBlank(message = "Booking ID wajib diisi")
    private String bookingId;

    private String userEmail;

    @NotNull(message = "Amount wajib diisi")
    @Positive(message = "Amount harus lebih dari 0")
    private Double amount;

    private String description;
}
