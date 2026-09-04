package corncine.example.auth_service.payload.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateStaffReq {
    @NotBlank(message = "Username wajib diisi")
    @Size(min = 4, max = 50)
    private String username;

    @NotBlank(message = "Password wajib diisi")
    @Size(min = 6)
    private String password;

    @NotBlank(message = "Nama lengkap wajib diisi")
    private String fullName;

    @NotBlank(message = "Email wajib diisi")
    @Email
    private String email;

    private String phoneNumber;
}
