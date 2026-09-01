package corncine.example.cinema_service.payload.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StudioReq {
    @NotNull(message = "Cinema ID wajib diisi")
    private Integer cinemaId;

    @NotNull(message = "Nomor studio wajib diisi")
    private Integer studioNumber;

    @NotBlank(message = "Tipe studio wajib diisi")
    private String studioType;

    @NotNull(message = "Total kursi wajib diisi")
    @Min(value = 1, message = "Total kursi minimal 1")
    private Integer totalSeats;
}
