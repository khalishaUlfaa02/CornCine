package corncine.example.auth_service.repository;

import corncine.example.auth_service.entity.TokenBlacklistEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklistEntity, Integer> {
    boolean existsByToken(String token);
    void deleteByExpiryDateBefore(LocalDateTime dateTime);
}
