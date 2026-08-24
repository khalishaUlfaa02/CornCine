package corncine.example.auth_service.service;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import corncine.example.auth_service.payload.res.UserProfileRes;

public interface UserService {
    UserProfileRes getMyProfile(String username);
    Page<UserProfileRes> getAllUsers(Pageable pageable);
    void toggleUserStatus(Integer userId);
    void softDeleteUser(Integer userId, String currentAdminUsername);
}
