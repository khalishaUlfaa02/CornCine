package corncine.example.ticket_service.payload.req;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BookingReq {
    @NotNull(message = "Schedule ID is required")
    private UUID scheduleId;

    @NotEmpty(message = "Seat IDs are required")
    private List<UUID> seatIds;
}
