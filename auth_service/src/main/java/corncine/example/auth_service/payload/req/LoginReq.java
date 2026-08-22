package corncine.example.auth_service.payload.req;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginReq {
    @NotBlank(message = "Username tidak boleh kosong")
    private String username;

    @NotBlank(message = "Password tidak boleh kosong")
    private String password;
}
