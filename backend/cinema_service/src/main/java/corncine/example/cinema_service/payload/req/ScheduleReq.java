package corncine.example.cinema_service.payload.req;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleReq {
    @NotNull(message = "Movie ID wajib diisi")
    private Integer movieId;

    @NotNull(message = "Studio ID wajib diisi")
    private Integer studioId;

    @NotNull(message = "Tanggal tayang wajib diisi")
    private LocalDate showDate;

    @NotNull(message = "Jam mulai tayang wajib diisi")
    private LocalTime startTime;

    @NotNull(message = "Harga tiket wajib diisi")
    private BigDecimal price;
}
