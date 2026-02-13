package jobapplier.api.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jobapplier.api.Manager;
import jobapplier.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jobapplier.repository.UserRepository;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class AuthController {

    private final Manager manager;
    private final UserRepository userRepo;
    public AuthController(Manager manager, UserRepository userRepo) {
        this.manager = manager;
        this.userRepo = userRepo;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = manager.authenticate(request.email(), request.password());
        
        if (user == null) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "Invalid credentials"));
        }
        
        return ResponseEntity.ok(Map.of(
            "id", user.getId().toString(),
            "email", user.getEmail(),
            "name", user.getName(),
            "surname", user.getSurname()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // Check if email already exists - use repository directly
        User existingUser = userRepo.findByEmail(request.email());
        if (existingUser != null) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Email already in use"));
        }
        
        try {
            // Create user without resume initially
            User user = new User(
                UUID.randomUUID(),
                request.name(),
                request.surname(),
                request.email(),
                request.password(),
                null,  // resume - will be set later
                true   // enabled
            );
            manager.saveProfile(user);
            
            return ResponseEntity.ok(Map.of(
                "id", user.getId().toString(),
                "email", user.getEmail(),
                "message", "User registered successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    // Request Records
    public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
    ) {}

    public record RegisterRequest(
        @NotBlank String name,
        @NotBlank String surname,
        @Email @NotBlank String email,
        @NotBlank String password
    ) {}
}