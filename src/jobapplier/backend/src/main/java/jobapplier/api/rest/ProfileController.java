package jobapplier.api.rest;

import jakarta.validation.Valid;
import jobapplier.api.Manager;
import jobapplier.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class ProfileController {

    private final Manager manager;

    public ProfileController(Manager manager) {
        this.manager = manager;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        // In a real implementation, fetch from repository
        // For now, return mock data
        return ResponseEntity.ok(Map.of(
            "id", userId,
            "contactInfo", Map.of(
                "firstName", "Lethabo",
                "lastName", "Neo",
                "email", "lethaboneo@icloud.com",
                "phoneNumber", "0814476357"
            ),
            "experience", new Object[]{
                Map.of(
                    "id", "1",
                    "title", "Junior Software Engineer",
                    "company", "Tech Corp",
                    "duration", "1 year",
                    "description", "Designed and built an end-to-end system that automatically sources job listings."
                )
            },
            "education", new Object[]{
                Map.of(
                    "id", "1",
                    "degree", "Bachelors of Science",
                    "field", "Computer Science and Applied Statistics",
                    "institution", "University of Cape Town",
                    "gpa", "4.0"
                )
            },
            "skills", new String[]{"Java", "Python", "React", "Spring Boot"},
            "projects", new Object[]{
                Map.of(
                    "id", "1",
                    "name", "AI Job Application App",
                    "description", "Automated job application system with AI integration."
                )
            },
            "certifications", new Object[]{
                Map.of("id", "1", "name", "AWS Cloud Practitioner", "link", "#")
            }
        ));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateProfile(
            @PathVariable String userId,
            @Valid @RequestBody ProfileUpdateRequest request) {
        // In a real implementation, update user profile
        return ResponseEntity.ok(Map.of(
            "message", "Profile updated successfully",
            "userId", userId
        ));
    }

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
