package corncine.example.auth_service.controller;

import org.springframework.web.bind.annotation.RestController;

import corncine.example.auth_service.payload.req.CreateStaffReq;
import corncine.example.auth_service.payload.res.UserProfileRes;
import corncine.example.auth_service.service.UserService;
import corncine.example.auth_service.utility.Message;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    // Akses: Semua User yang telah terotentikasi (CUSTOMER, STAFF, ADMIN)
    @GetMapping("/profile")
    public ResponseEntity<Message> getProfile(Authentication authentication) {
        UserProfileRes profile = userService.getMyProfile(authentication.getName());
        return new ResponseEntity<>(Message.success("Data profil berhasil diambil", profile), HttpStatus.OK);
    }

    // Akses: Hanya ADMIN
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "userId") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserProfileRes> users = userService.getAllUsers(pageable);

        return new ResponseEntity<>(Message.success("Daftar user berhasil dimuat", users), HttpStatus.OK);
    }

    // Akses: Hanya ADMIN
    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> toggleStatus(@PathVariable Integer userId) {
        userService.toggleUserStatus(userId);
        return new ResponseEntity<>(Message.success("Status user berhasil diubah", null), HttpStatus.OK);
    }

    // Akses: Hanya ADMIN
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> softDelete(@PathVariable Integer userId, Authentication authentication) {
        userService.softDeleteUser(userId, authentication.getName());
        return new ResponseEntity<>(Message.success("User berhasil dihapus (Soft Delete)", null), HttpStatus.OK);
    }

    // Akses: HANYA ADMIN YANG DAPAT MEMBUAT AKUN STAFF
    @PostMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Message> createStaff(@Valid @RequestBody CreateStaffReq req) {
        userService.createStaff(req);
        return new ResponseEntity<>(Message.success("Akun Staff berhasil dibuat oleh Administrator.", null),
            HttpStatus.CREATED);
    }
}
