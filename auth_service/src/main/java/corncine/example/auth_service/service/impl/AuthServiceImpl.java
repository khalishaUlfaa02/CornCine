package corncine.example.auth_service.service.impl;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import corncine.example.auth_service.payload.req.*;
import corncine.example.auth_service.payload.res.JwtRes;
import corncine.example.auth_service.entity.*;
import corncine.example.auth_service.exception.ResourceNotFoundException;
import corncine.example.auth_service.repository.*;
import corncine.example.auth_service.service.AuthService;
import corncine.example.auth_service.utility.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PasswordResetRepository passwordResetRepository;

    @Autowired
    private TokenBlacklistRepository tokenBlacklistRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JavaMailSender mailSender;

    @Override
    @Transactional
    public JwtRes login(LoginReq req) {
        UserEntity user = userRepository.findByUsernameAndDeletedFalse(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Username atau password salah."));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Akun Anda sedang dinonaktifkan. Hubungi Administrator.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Username atau password salah.");
        }

        UserProfileEntity profile = userProfileRepository.findByUser_UserId(user.getUserId()).orElse(null);

        String fullName = (profile != null) ? profile.getFullName() : user.getUsername();
        String token = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getEmail(),
                user.getRole().getRoleCode());

        return JwtRes.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(fullName)
                .email(user.getEmail())
                .role(user.getRole().getRoleCode())
                .build();
    }

    @Override
    @Transactional
    public void register(RegisterReq req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username sudah terdaftar.");
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email sudah digunakan.");
        }

        RoleEntity userRole = roleRepository.findByRoleCode("CUSTOMER")
            .orElseThrow(
                () -> new ResourceNotFoundException("Role CUSTOMER tidak ditemukan di database."));

        UserEntity user = UserEntity.builder()
            .username(req.getUsername())
            .password(passwordEncoder.encode(req.getPassword()))
            .email(req.getEmail())
            .role(userRole)
            .status("ACTIVE")
            .deleted(false)
            .build();

        UserEntity savedUser = userRepository.save(user);

        UserProfileEntity profile = UserProfileEntity.builder()
                .user(savedUser)
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber())
                .build();

        userProfileRepository.save(profile);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordReq req) {
        UserEntity user = userRepository.findByEmailAndDeletedFalse(req.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Email tidak ditemukan dalam sistem kami."));

        String token = UUID.randomUUID().toString();

        PasswordResetEntity resetEntity = PasswordResetEntity.builder()
                .email(user.getEmail())
                .token(token)
                .expiryDate(LocalDateTime.now().plusMinutes(15)) // Berlaku 15 menit
                .isUsed(false)
                .build();

        passwordResetRepository.save(resetEntity);

        // Mengirim email simulasi / SMTP riil
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(user.getEmail());
                message.setSubject("CornCine - Reset Password Token");
                message.setText("Gunakan token berikut untuk mereset kata sandi Anda: " + token
                        + "\nToken ini berlaku selama 15 menit.");
                mailSender.send(message);
            } catch (Exception e) {
                log.error("Gagal mengirim email: {}", e.getMessage(), e);
            }
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordReq req) {
        PasswordResetEntity resetEntity = passwordResetRepository.findByTokenAndIsUsedFalse(req.getToken())
                .orElseThrow(() -> new RuntimeException("Token reset password tidak valid atau sudah digunakan."));

        if (resetEntity.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token reset password telah kedaluwarsa.");
        }

        UserEntity user = userRepository.findByEmailAndDeletedFalse(resetEntity.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User tidak ditemukan."));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        resetEntity.setIsUsed(true);
        passwordResetRepository.save(resetEntity);
    }

    @Override
    @Transactional
    public void logout(String token) {
        if (tokenBlacklistRepository.existsByToken(token)) {
            throw new RuntimeException("Token sudah tidak valid.");
        }

        Date expiration = jwtUtil.extractAllClaims(token).getExpiration();
        LocalDateTime expiryDate = Instant.ofEpochMilli(expiration.getTime())
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

        TokenBlacklistEntity blacklist = TokenBlacklistEntity.builder()
                .token(token)
                .expiryDate(expiryDate)
                .build();

        tokenBlacklistRepository.save(blacklist);
    }

    @Override
    public JwtRes refreshToken(String token) {
        if (!jwtUtil.isTokenValid(token)) {
            throw new RuntimeException("Token tidak valid atau sudah kedaluwarsa.");
        }

        if (tokenBlacklistRepository.existsByToken(token)) {
            throw new RuntimeException("Token sudah tidak valid.");
        }

        String username = jwtUtil.extractUsername(token);
        UserEntity user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new ResourceNotFoundException("User tidak ditemukan."));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Akun Anda sedang dinonaktifkan.");
        }

        UserProfileEntity profile = userProfileRepository.findByUser_UserId(user.getUserId()).orElse(null);
        String fullName = (profile != null) ? profile.getFullName() : user.getUsername();

        String newToken = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getEmail(),
                user.getRole().getRoleCode());

        return JwtRes.builder()
                .token(newToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(fullName)
                .email(user.getEmail())
                .role(user.getRole().getRoleCode())
                .build();
    }
}
