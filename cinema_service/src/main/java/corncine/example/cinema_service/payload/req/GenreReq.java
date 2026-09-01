package corncine.example.cinema_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenreReq {
    @NotBlank(message = "Nama genre tidak boleh kosong")
    private String genreName;
}
