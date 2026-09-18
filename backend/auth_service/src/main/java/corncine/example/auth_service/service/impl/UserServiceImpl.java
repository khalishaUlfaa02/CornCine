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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final JavaMailSender mailSender;

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

        // Kirim email pemberitahuan ke akun Staff dan laporan Admin dengan format HTML
        if (mailSender != null) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm");
                String currentTime = LocalDateTime.now().format(formatter);

                // --- 1. Email Ke Staff (HTML) ---
                MimeMessage staffMsg = mailSender.createMimeMessage();
                MimeMessageHelper staffHelper = new MimeMessageHelper(staffMsg, true, "UTF-8");
                staffHelper.setTo(req.getEmail());
                staffHelper.setSubject("Akses Akun Staff CornCine");

                String staffHtml = "<div style=\"font-family: sans-serif; background-color: #0f172a; padding: 40px 20px; color: #f1f5f9;\">"
                        + "<div style=\"max-w-xl mx-auto background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); max-width: 600px; margin: 0 auto;\">"
                        + "<div style=\"text-align: center; margin-bottom: 20px;\">"
                        + "<span style=\"color: #f59e0b; font-weight: bold; font-size: 14px; letter-spacing: 2px;\">🍿 CORNCINE TEAM</span>"
                        + "<h2 style=\"color: #ffffff; font-size: 24px; margin: 10px 0 0 0;\">Selamat Bergabung!</h2>"
                        + "</div>"
                        + "<p style=\"font-size: 15px; color: #cbd5e1; line-height: 1.6;\">Halo <strong>" + req.getFullName() + "</strong>,</p>"
                        + "<p style=\"font-size: 15px; color: #cbd5e1; line-height: 1.6;\">Akun Anda di sistem CornCine telah berhasil didaftarkan oleh Administrator. Berikut adalah detail login Anda:</p>"
                        + "<div style=\"background-color: #0b1120; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #1e293b;\">"
                        + "<table style=\"width: 100%; border-collapse: collapse; color: #cbd5e1; font-size: 14px;\">"
                        + "<tr><td style=\"padding: 8px 0; font-weight: bold; width: 35%;\">Username</td><td style=\"padding: 8px 0; color: #f59e0b; font-weight: bold;\">" + req.getUsername() + "</td></tr>"
                        + "<tr><td style=\"padding: 8px 0; font-weight: bold;\">Password</td><td style=\"padding: 8px 0; color: #38bdf8; font-weight: bold;\">" + req.getPassword() + "</td></tr>"
                        + "<tr><td style=\"padding: 8px 0; font-weight: bold;\">Peran Akses</td><td style=\"padding: 8px 0;\">Staff Bioskop</td></tr>"
                        + "</table>"
                        + "</div>"
                        + "<p style=\"font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 25px;\">Untuk keamanan sistem, pastikan Anda segera masuk ke Panel Admin dan mengganti password sementara ini.</p>"
                        + "<div style=\"border-top: 1px solid #334155; padding-top: 20px; text-align: center;\">"
                        + "<p style=\"font-size: 12px; color: #64748b; margin: 0;\">Email otomatis dari CornCine Cinema Management System.<br>Mohon tidak membalas email ini.</p>"
                        + "</div>"
                        + "</div>"
                        + "</div>";

                staffHelper.setText(staffHtml, true);
                mailSender.send(staffMsg);

                // --- 2. Email Laporan ke Admin Utama (HTML) ---
                MimeMessage adminMsg = mailSender.createMimeMessage();
                MimeMessageHelper adminHelper = new MimeMessageHelper(adminMsg, true, "UTF-8");
                adminHelper.setTo("khalishaulfaa@gmail.com");
                adminHelper.setSubject("Laporan: Akun Staff Baru Terdaftar");

                String adminHtml = "<div style=\"font-family: sans-serif; background-color: #0f172a; padding: 40px 20px; color: #f1f5f9;\">"
                        + "<div style=\"max-w-xl mx-auto background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); max-width: 600px; margin: 0 auto;\">"
                        + "<div style=\"text-align: center; margin-bottom: 25px;\">"
                        + "<span style=\"color: #f59e0b; font-weight: bold; font-size: 14px; letter-spacing: 2px;\">🍿 CORNCINE NOTIFICATION</span>"
                        + "<h2 style=\"color: #ffffff; font-size: 22px; margin: 10px 0 0 0;\">Pendaftaran Akun Staff Baru</h2>"
                        + "</div>"
                        + "<p style=\"font-size: 15px; color: #cbd5e1; line-height: 1.6;\">Halo Admin, sistem baru saja mendeteksi penambahan akun staff baru dengan detail berikut:</p>"
                        + "<div style=\"background-color: #0b1120; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #1e293b;\">"
                        + "<table style=\"width: 100%; border-collapse: collapse; color: #cbd5e1; font-size: 14px;\">"
                        + "<tr><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b; font-weight: bold; width: 35%;\">Nama Lengkap</td><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b; color: #ffffff;\">" + req.getFullName() + "</td></tr>"
                        + "<tr><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b; font-weight: bold;\">Username</td><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b; color: #7dd3fc;\">@" + req.getUsername() + "</td></tr>"
                        + "<tr><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b; font-weight: bold;\">Email</td><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b;\">" + req.getEmail() + "</td></tr>"
                        + "<tr><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b; font-weight: bold;\">Peran</td><td style=\"padding: 10px 0; border-bottom: 1px solid #1e293b;\">Staff Bioskop</td></tr>"
                        + "<tr><td style=\"padding: 10px 0; font-weight: bold;\">Waktu Dibuat</td><td style=\"padding: 10px 0; color: #f59e0b;\">" + currentTime + "</td></tr>"
                        + "</table>"
                        + "</div>"
                        + "<p style=\"font-size: 13px; color: #10b981; font-weight: bold; text-align: center; margin-bottom: 25px;\">✓ Aksi ini dilakukan secara sah dari Panel Admin.</p>"
                        + "<div style=\"border-top: 1px solid #334155; padding-top: 20px; text-align: center;\">"
                        + "<p style=\"font-size: 12px; color: #64748b; margin: 0;\">Email otomatis dari CornCine Cinema Management System.<br>Jangan membalas email ini.</p>"
                        + "</div>"
                        + "</div>"
                        + "</div>";

                adminHelper.setText(adminHtml, true);
                mailSender.send(adminMsg);

            } catch (Exception e) {
                log.error("Gagal mengirim email notifikasi pembuatan staff HTML: {}", e.getMessage());
            }
        }
    }
}
