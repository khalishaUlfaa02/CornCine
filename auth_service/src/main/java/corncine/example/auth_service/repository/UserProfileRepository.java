package corncine.example.auth_service.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import corncine.example.auth_service.entity.UserProfileEntity;

public interface UserProfileRepository extends JpaRepository<UserProfileEntity, Integer>{
    Optional<UserProfileEntity> findByUser_UserId(Integer userId);   
}
