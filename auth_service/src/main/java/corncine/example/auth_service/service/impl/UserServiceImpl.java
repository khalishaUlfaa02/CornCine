package corncine.example.auth_service.service.impl;

import corncine.example.auth_service.entity.UserEntity;
import corncine.example.auth_service.entity.UserProfileEntity;
import corncine.example.auth_service.exception.ResourceNotFoundException;
import corncine.example.auth_service.payload.res.UserProfileRes;
import corncine.example.auth_service.repository.UserProfileRepository;
import corncine.example.auth_service.repository.UserRepository;
import corncine.example.auth_service.service.UserService;
import jakarta.transaction.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService{
    private UserRepository userRepository;
    private UserProfileRepository userProfileRepository;

    private UserProfileRes mapToRes(UserEntity user, UserProfileEntity profile) {
        return UserProfileRes.builder()
            .userId(user.getUserId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole().getRoleCode())
            .status(user.getStatus())
            .fullName(profile != null ? profile.getFullName() : "-")
            .phoneNumber(profile != null ? profile.getPhoneNumber() : "-")
            .identityCardNumber(profile != null ? profile.getIdentityCardNumber() : "-")
            .birthDate(profile != null ? profile.getBirthDate() : null)
            .gender(profile != null ? profile.getGender() : "-")
            .address(profile != null ? profile.getAddress() : "-")
            .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
            .build();
    }

    @Override
    public UserProfileRes getMyProfile(String username) {
        UserEntity user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new ResourceNotFoundException("User tidak ditemukan."));
        UserProfileEntity profile = userProfileRepository.findByUser_UserId(user.getUserId()).orElse(null);
        return mapToRes(user, profile);
    }

    @Override
    public Page<UserProfileRes> getAllUsers(Pageable pageable) {
        return userRepository.findByDeletedFalse(pageable)
                .map(user -> {
                    UserProfileEntity profile = userProfileRepository.findByUser_UserId(user.getUserId()).orElse(null);
                    return mapToRes(user, profile);
                });
    }

    @Override
    @Transactional
    public void toggleUserStatus(Integer userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User ID " + userId + " tidak ditemukan."));

        user.setStatus("ACTIVE".equalsIgnoreCase(user.getStatus()) ? "INACTIVE" : "ACTIVE");
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void softDeleteUser(Integer userId, String currentAdminUsername) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User ID " + userId + " tidak ditemukan."));

        if (user.getUsername().equalsIgnoreCase(currentAdminUsername)) {
            throw new RuntimeException("Anda tidak dapat menghapus akun Anda sendiri.");
        }

        user.setDeleted(true);
        userRepository.save(user);
    }
}
