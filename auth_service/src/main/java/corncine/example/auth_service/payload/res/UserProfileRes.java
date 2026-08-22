package corncine.example.auth_service.payload.res;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRes {
    private Integer userId;
    private String username;
    private String email;
    private String role;
    private String status;
    private String fullName;
    private String phoneNumber;
    private String identityCardNumber;
    private LocalDate birthDate;
    private String gender;
    private String address;
    private String avatarUrl;
}
