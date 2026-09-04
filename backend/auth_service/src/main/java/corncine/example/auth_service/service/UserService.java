package corncine.example.auth_service.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import corncine.example.auth_service.payload.req.ChangePasswordReq;
import corncine.example.auth_service.payload.req.CreateStaffReq;
import corncine.example.auth_service.payload.req.UpdateProfileReq;
import corncine.example.auth_service.payload.res.UserProfileRes;

public interface UserService {
    UserProfileRes getMyProfile(String username);
    UserProfileRes updateMyProfile(String username, UpdateProfileReq req);
    void changePassword(String username, ChangePasswordReq req);
    Page<UserProfileRes> getAllUsers(Pageable pageable);
    void toggleUserStatus(Integer userId);
    void softDeleteUser(Integer userId, String currentAdminUsername);
    void createStaff(CreateStaffReq req);
}
