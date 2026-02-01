package jobapplier.api.rest;

import jobapplier.api.Manager;
import jobapplier.model.Application;
import jobapplier.model.Job;
import jobapplier.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:5173")
public class ApplicationController {

    private final Manager manager;

    public ApplicationController(Manager manager) {
        this.manager = manager;
    }

    @PostMapping
    public ResponseEntity<?> createApplication(@RequestBody CreateApplicationRequest request) {
        // In real implementation, create via manager
        return ResponseEntity.ok(Map.of(
            "id", UUID.randomUUID().toString(),
            "userId", request.userId(),
            "jobId", request.jobId(),
            "status", "DRAFT",
            "message", "Application created successfully"
        ));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserApplications(@PathVariable String userId) {
        return ResponseEntity.ok(Map.of(
            "applications", new Object[]{
                Map.of(
                    "id", "app-1",
                    "jobId", "job-1",
                    "jobTitle", "Software Engineer",
                    "company", "Tech Corp",
                    "status", "DRAFT",
                    "createdAt", "2026-01-15T10:00:00Z"
                )
            }
        ));
    }

    @PostMapping("/{applicationId}/submit")
    public ResponseEntity<?> submitApplication(@PathVariable String applicationId) {
        return ResponseEntity.ok(Map.of(
            "applicationId", applicationId,
            "status", "SUBMITTED",
            "message", "Application submitted successfully"
        ));
    }

    @PostMapping("/{applicationId}/cover-letter")
    public ResponseEntity<?> generateCoverLetter(@PathVariable String applicationId) {
        return ResponseEntity.ok(Map.of(
            "applicationId", applicationId,
            "taskId", UUID.randomUUID().toString(),
            "status", "RUNNING",
            "message", "Cover letter generation started"
        ));
    }

    @PostMapping("/{applicationId}/resume")
    public ResponseEntity<?> generateResume(@PathVariable String applicationId) {
        return ResponseEntity.ok(Map.of(
            "applicationId", applicationId,
            "taskId", UUID.randomUUID().toString(),
            "status", "RUNNING",
            "message", "Resume generation started"
        ));
    }

    // Request Records
    public record CreateApplicationRequest(
        String userId,
        String jobId
    ) {}
}
