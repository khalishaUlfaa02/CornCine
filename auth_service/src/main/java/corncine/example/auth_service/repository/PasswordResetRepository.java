package corncine.example.auth_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetRepository extends JpaRepository<PasswordResetRepository, Integer>{
    Optional<PasswordResetRepository> findByTokenAndIsUsedFalse(String token);
}
