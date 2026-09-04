package corncine.example.auth_service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import corncine.example.auth_service.payload.req.ForgotPasswordReq;
import corncine.example.auth_service.payload.req.LoginReq;
import corncine.example.auth_service.payload.req.RegisterReq;
import corncine.example.auth_service.payload.req.ResetPasswordReq;
import corncine.example.auth_service.payload.res.JwtRes;
import corncine.example.auth_service.service.AuthService;
import corncine.example.auth_service.utility.Message;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Message> login(@Valid @RequestBody LoginReq req) {
        JwtRes jwtRes = authService.login(req);
        return new ResponseEntity<>(Message.success("Login berhasil", jwtRes), HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity<Message> register(@Valid @RequestBody RegisterReq req) {
        authService.register(req);
        return new ResponseEntity<>(Message.success("Registrasi berhasil, silakan login.", null), HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Message> forgotPassword(@Valid @RequestBody ForgotPasswordReq req) {
        authService.forgotPassword(req);
        return new ResponseEntity<>(Message.success("Token reset password telah dikirim ke email Anda.", null), HttpStatus.OK);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Message> resetPassword(@Valid @RequestBody ResetPasswordReq req) {
        authService.resetPassword(req);
        return new ResponseEntity<>(Message.success("Kata sandi berhasil diperbarui, silakan login kembali.", null), HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<Message> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token tidak ditemukan.");
        }
        String token = authHeader.substring(7);
        authService.logout(token);
        return new ResponseEntity<>(Message.success("Logout berhasil.", null), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Message> refreshToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token tidak ditemukan.");
        }
        String token = authHeader.substring(7);
        JwtRes jwtRes = authService.refreshToken(token);
        return new ResponseEntity<>(Message.success("Token berhasil diperbarui.", jwtRes), HttpStatus.OK);
    }
}
