package corncine.example.cinema_service.payload.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CinemaReq {
    @NotBlank(message = "Nama bioskop tidak boleh kosong")
    private String name;

    @NotBlank(message = "Kota tidak boleh kosong")
    private String city;

    @NotBlank(message = "Alamat tidak boleh kosong")
    private String address;

    private String phoneNumber;
}
