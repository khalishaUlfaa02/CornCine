package corncine.example.auth_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_password_resets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reset_id")
    private Integer resetId;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
