package corncine.example.auth_service.service.impl;

import java.time.LocalDateTime;
import java.util.UUID;

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

@Service
public class AuthServiceImpl implements AuthService{
    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private UserProfileRepository userProfileRepository;
    private PasswordResetRepository passwordResetRepository;
    private PasswordEncoder passwordEncoder;
    private JwtUtil jwtUtil;
    private JavaMailSender mailSender;

    @Override
    public JwtRes login(LoginReq req){
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
        String token = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getEmail(), user.getRole().getRoleCode());

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
    public void register(RegisterReq req){
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username sudah terdaftar.");
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email sudah digunakan.");
        }

        RoleEntity customerRole = roleRepository.findByRoleCode("CUSTOMER")
                .orElseThrow(() -> new ResourceNotFoundException("Role CUSTOMER tidak ditemukan di database."));

        UserEntity user = UserEntity.builder()
            .username(req.getUsername())
            .password(passwordEncoder.encode(req.getPassword()))
            .email(req.getEmail())
            .role(customerRole)
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
                message.setText("Gunakan token berikut untuk mereset kata sandi Anda: " + token + "\nToken ini berlaku selama 15 menit.");
                mailSender.send(message);
            } catch (Exception e) {
                System.err.println("Gagal mengirim email: " + e.getMessage());
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
}

