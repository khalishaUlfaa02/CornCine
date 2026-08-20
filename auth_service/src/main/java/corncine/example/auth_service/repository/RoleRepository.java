package corncine.example.auth_service.repository;

import corncine.example.auth_service.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Integer>{
    Optional<RoleEntity> findByRoleCode(String roleCode);
}
