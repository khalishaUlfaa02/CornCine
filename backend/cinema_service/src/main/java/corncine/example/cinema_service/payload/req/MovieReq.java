package corncine.example.cinema_service.payload.req;

import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MovieReq {
    @NotBlank(message = "Judul film tidak boleh kosong")
    private String title;

    private String synopsis;

    @NotNull(message = "Durasi film wajib diisi")
    @Min(value = 1, message = "Durasi film minimal 1 menit")
    private Integer durationMinutes;

    private String posterUrl;
    private String trailerUrl;
    private LocalDate releaseDate;
    private String ageRating;
    private String director;
    private String castMembers;

    @NotEmpty(message = "Minimal cantumkan 1 genre")
    private List<Integer> genreIds;
}
