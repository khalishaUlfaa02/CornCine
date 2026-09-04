package corncine.example.auth_service.payload.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtRes {
    private String token;
    private String tokenType = "Bearer";
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private String role;
}
