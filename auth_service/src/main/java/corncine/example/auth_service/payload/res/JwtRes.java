package corncine.example.auth_service.payload.res;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtRes {
    private String token;
    private String type = "Bearer";
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private String role;
}
