package corncine.example.auth_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfileRepository, Integer>{
    Optional<UserProfileRepository> findByUser_UserId(Integer userId);   
}
