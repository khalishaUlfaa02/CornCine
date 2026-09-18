package corncine.example.ticket_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ValidateTicketReq {
    @NotBlank(message = "Kode booking tidak boleh kosong")
    private String bookingCode;
}
