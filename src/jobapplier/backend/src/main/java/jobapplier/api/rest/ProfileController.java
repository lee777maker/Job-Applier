package jobapplier.api.rest;

import jakarta.validation.Valid;
import jobapplier.api.Manager;
import jobapplier.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jobapplier.repository.UserRepository;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class ProfileController {

    private final Manager manager;
    private final UserRepository userRepo;
    
    public ProfileController(Manager manager, UserRepository userRepo) {
        this.manager = manager;
        this.userRepo = userRepo;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        // In a real implementation, fetch from repository
        // For now, return mock data
        User user = userRepo.findById(UUID.fromString(userId)).orElse(null);
        if(user == null){
            return ResponseEntity.notFound().build();
        }
        if (user.getProfileData() != null) {
            try {
                return ResponseEntity.ok(new ObjectMapper().readValue(user.getProfileData(), Map.class));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
            }
        }
        return ResponseEntity.ok(Map.of(
            "contactInfo", Map.of(
                "firstName", user.getName(),
                "lastName", user.getSurname(),
                "email", user.getEmail()
            ),
            "experience", new Object[]{},
            "education", new Object[]{},
            "projects", new Object[]{},
            "skills", new String[]{},
            "certifications", new Object[]{}
        ));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateProfile(
            @PathVariable String userId,
            @Valid @RequestBody Map<String, Object> profile) {
        // In a real implementation, update user profile
        User user = userRepo.findById(UUID.fromString(userId)).orElse(null);
        if(user == null){
            return ResponseEntity.notFound().build();
    }
        try{
            user.setProfileData(new ObjectMapper().writeValueAsString(profile));
            userRepo.save(user);

            return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));}
            catch(Exception e){
                return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
            

        }}

    // Request/Response Records
    public record ProfileUpdateRequest(
        ContactInfo contactInfo,
        Object[] experience,
        Object[] education,
        Object[] projects,
        String[] skills,
        Object[] certifications
    ) {}

    public record ContactInfo(
        String firstName,
        String lastName,
        String email,
        String phoneNumber
    ) {}
}
