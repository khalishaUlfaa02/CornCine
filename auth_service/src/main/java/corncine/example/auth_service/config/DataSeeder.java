package corncine.example.auth_service.config;

import org.springframework.stereotype.Component;
import corncine.example.auth_service.entity.RoleEntity;
import corncine.example.auth_service.entity.UserEntity;
import corncine.example.auth_service.entity.UserProfileEntity;
import corncine.example.auth_service.repository.RoleRepository;
import corncine.example.auth_service.repository.UserProfileRepository;
import corncine.example.auth_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Inisialisasi Data Master Role
        RoleEntity adminRole = roleRepository.findByRoleCode("ADMIN").orElseGet(() -> 
            roleRepository.save(RoleEntity.builder().roleName("Administrator").roleCode("ADMIN").isActive(true).build())
        );

        roleRepository.findByRoleCode("STAFF").orElseGet(() -> 
            roleRepository.save(RoleEntity.builder().roleName("Staff Bioskop").roleCode("STAFF").isActive(true).build())
        );

        roleRepository.findByRoleCode("CUSTOMER").orElseGet(() -> 
            roleRepository.save(RoleEntity.builder().roleName("Customer").roleCode("CUSTOMER").isActive(true).build())
        );

        // 2. Inisialisasi Akun Super Admin Default
        if (!userRepository.existsByUsername("admin")) {
            UserEntity adminUser = UserEntity.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("password123")) // Password default terenkripsi BCrypt
                    .email("admin@corncine.com")
                    .role(adminRole)
                    .status("ACTIVE")
                    .deleted(false)
                    .build();

            UserEntity savedAdmin = userRepository.save(adminUser);

            UserProfileEntity adminProfile = UserProfileEntity.builder()
                    .user(savedAdmin)
                    .fullName("Super Administrator CornCine")
                    .phoneNumber("081122334455")
                    .build();

            userProfileRepository.save(adminProfile);
            System.out.println(">>> SEEDER: Akun Admin Default Berhasil Dibuat (admin / password123)");
        }
    }
}
