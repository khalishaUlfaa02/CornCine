package corncine.example.ticket_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BookingReq {
    // String agar menerima ID integer dari cinema_service ("1") maupun UUID lama.
    // Jangan pakai UUID di sini: Jackson gagal parse "1" menjadi UUID (36-char).
    @NotBlank(message = "Schedule ID is required")
    private String scheduleId;

    @NotEmpty(message = "Seat IDs are required")
    private List<String> seatIds;
}
