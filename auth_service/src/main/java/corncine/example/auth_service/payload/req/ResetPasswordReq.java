package corncine.example.auth_service.payload.req;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class ResetPasswordReq {
    @NotBlank(message = "Token wajib disertakan")
    private String token;

    @NotBlank(message = "Password baru wajib diisi")
    @Size(min = 6, message = "Password baru minimal 6 karakter")
    private String newPassword;
}
