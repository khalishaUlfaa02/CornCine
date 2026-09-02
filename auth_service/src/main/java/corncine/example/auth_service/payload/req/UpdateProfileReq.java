package corncine.example.auth_service.payload.req;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateProfileReq {
    @Size(max = 100, message = "Nama lengkap maksimal 100 karakter")
    private String fullName;

    @Size(max = 20, message = "Nomor telepon maksimal 20 karakter")
    private String phoneNumber;

    @Size(max = 30, message = "Nomor identitas maksimal 30 karakter")
    private String identityCardNumber;

    private LocalDate birthDate;

    @Size(max = 10, message = "Gender maksimal 10 karakter")
    private String gender;

    private String address;

    @Size(max = 500, message = "URL avatar maksimal 500 karakter")
    private String avatarUrl;
}
