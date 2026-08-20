package corncine.example.auth_service.repository;

import corncine.example.auth_service.entity.UserEntity;

import org.springframework.boot.data.autoconfigure.web.DataWebProperties.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByUsernameAndDeletedFalse(String username);
    Optional<UserEntity> findByEmailAndDeletedFalse(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    Page<UserEntity> findByDeletedFalse(Pageable pageable);
}
