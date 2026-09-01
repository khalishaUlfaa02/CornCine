package corncine.example.cinema_service.payload.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SeatReq {
    @NotNull(message = "Studio ID wajib diisi")
    private Integer studioId;

    @NotBlank(message = "Baris kursi wajib diisi")
    private String seatRow;

    @NotNull(message = "Nomor kursi wajib diisi")
    @Min(value = 1, message = "Nomor kursi minimal 1")
    private Integer seatNumber;

    private String seatType;
}
