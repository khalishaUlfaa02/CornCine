package corncine.example.auth_service.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import corncine.example.auth_service.entity.PasswordResetEntity;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordResetEntity, Integer>{
    Optional<PasswordResetEntity> findByTokenAndIsUsedFalse(String token);
}
