package corncine.example.cinema_service.payload.res;

import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieRes {
    private Integer movieId;
    private String title;
    private String synopsis;
    private Integer durationMinutes;
    private String posterUrl;
    private String trailerUrl;
    private LocalDate releaseDate;
    private String ageRating;
    private String director;
    private String castMembers;
    private List<String> genres;
}
