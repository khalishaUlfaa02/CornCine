package corncine.example.cinema_service.payload.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CinemaRes {
    private Integer cinemaId;
    private String name;
    private String city;
    private String address;
    private String phoneNumber;
    private Boolean isActive;
}
