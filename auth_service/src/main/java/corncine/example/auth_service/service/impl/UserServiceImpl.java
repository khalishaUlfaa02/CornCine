package corncine.example.auth_service.service.impl;

import corncine.example.auth_service.entity.RoleEntity;
import corncine.example.auth_service.entity.UserEntity;
import corncine.example.auth_service.entity.UserProfileEntity;
import corncine.example.auth_service.exception.ResourceNotFoundException;
import corncine.example.auth_service.payload.req.ChangePasswordReq;
import corncine.example.auth_service.payload.req.CreateStaffReq;
import corncine.example.auth_service.payload.req.UpdateProfileReq;
import corncine.example.auth_service.payload.res.UserProfileRes;
import corncine.example.auth_service.repository.RoleRepository;
import corncine.example.auth_service.repository.UserProfileRepository;
import corncine.example.auth_service.repository.UserRepository;
import corncine.example.auth_service.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;

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
    @Transactional
    public UserProfileRes getMyProfile(String username) {
        UserEntity user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new ResourceNotFoundException("User tidak ditemukan."));
        UserProfileEntity profile = userProfileRepository.findByUser_UserId(user.getUserId()).orElse(null);
        return mapToRes(user, profile);
    }

    @Override
    @Transactional
    public UserProfileRes updateMyProfile(String username, UpdateProfileReq req) {
        UserEntity user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new ResourceNotFoundException("User tidak ditemukan."));

        UserProfileEntity profile = userProfileRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Profil user tidak ditemukan."));

        if (req.getFullName() != null) profile.setFullName(req.getFullName());
        if (req.getPhoneNumber() != null) profile.setPhoneNumber(req.getPhoneNumber());
        if (req.getIdentityCardNumber() != null) profile.setIdentityCardNumber(req.getIdentityCardNumber());
        if (req.getBirthDate() != null) profile.setBirthDate(req.getBirthDate());
        if (req.getGender() != null) profile.setGender(req.getGender());
        if (req.getAddress() != null) profile.setAddress(req.getAddress());
        if (req.getAvatarUrl() != null) profile.setAvatarUrl(req.getAvatarUrl());

        userProfileRepository.save(profile);
        return mapToRes(user, profile);
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordReq req) {
        UserEntity user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new ResourceNotFoundException("User tidak ditemukan."));

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Password lama tidak sesuai.");
        }

        if (req.getOldPassword().equals(req.getNewPassword())) {
            throw new RuntimeException("Password baru tidak boleh sama dengan password lama.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
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

    @Override
    @Transactional
    public void createStaff(CreateStaffReq req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username staff sudah terdaftar.");
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email staff sudah digunakan.");
        }

        RoleEntity staffRole = roleRepository.findByRoleCode("STAFF")
                .orElseThrow(() -> new ResourceNotFoundException("Role STAFF tidak ditemukan."));

        UserEntity staffUser = UserEntity.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .email(req.getEmail())
                .role(staffRole) // Role dikunci sebagai STAFF
                .status("ACTIVE")
                .deleted(false)
                .build();

        UserEntity savedUser = userRepository.save(staffUser);

        UserProfileEntity profile = UserProfileEntity.builder()
                .user(savedUser)
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber())
                .build();

        userProfileRepository.save(profile);
    }
}
