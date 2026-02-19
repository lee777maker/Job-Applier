package jobapplier.api.rest;

import jobapplier.model.Application;
import jobapplier.model.Job;
import jobapplier.repository.ApplicationRepository;
import jobapplier.repository.JobRepository;
import jobapplier.workflow.ApplicationStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    public ApplicationController(ApplicationRepository applicationRepository, JobRepository jobRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
    }

    @PostMapping
    public ResponseEntity<?> createApplication(@RequestBody CreateApplicationRequest request) {
        try {
            Application app = new Application();
            app.setUserId(UUID.fromString(request.userId()));

            // Resolve jobId — create stub job if not provided
            UUID jobId;
            if (request.jobId() != null && !request.jobId().isBlank()) {
                jobId = UUID.fromString(request.jobId());
            } else {
                // Create a stub Job for manually entered applications
                Job stub = new Job(
                    UUID.randomUUID(),
                    request.company(),
                    request.role(),
                    request.jobDescription(),
                    null,
                    Instant.now()
                );
                jobRepository.save(stub);
                jobId = stub.getId();
            }
            app.setJobId(jobId);

            // Set all fields with null checks
            app.setCompany(request.company() != null ? request.company() : "Unknown Company");
            app.setRole(request.role() != null ? request.role() : "Unknown Role");
            app.setLocation(request.location());
            app.setStatus(parseStatus(request.status()));
            app.setAppliedAt(request.appliedAt() != null && !request.appliedAt().isBlank()
                ? Instant.parse(request.appliedAt())
                : Instant.now());
            app.setNotes(request.notes());
            app.setSource(request.source() != null ? request.source() : "manual");
            app.setApplicationUrl(request.applicationUrl());
            app.setMatchScore(request.matchScore());
            
            Application saved = applicationRepository.save(app);
            
            return ResponseEntity.ok(Map.of(
                "id", saved.getId().toString(),
                "userId", saved.getUserId().toString(),
                "jobId", saved.getJobId() != null ? saved.getJobId().toString() : null,
                "company", saved.getCompany(),
                "role", saved.getRole(),
                "status", saved.getStatus() != null ? saved.getStatus().name() : "DRAFT",
                "appliedAt", saved.getAppliedAt() != null ? saved.getAppliedAt().toString() : saved.getCreatedAt().toString(),
                "matchScore", saved.getMatchScore(),
                "message", "Application created successfully"
            ));
        } catch (Exception e) {
            e.printStackTrace(); // Log full error
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to create application: " + e.getMessage(),
                "details", e.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserApplications(@PathVariable String userId) {
        try {
            UUID userUUID = UUID.fromString(userId);
            List<Application> applications = applicationRepository.findByUserIdOrderByAppliedAtDesc(userUUID);
            
            List<Map<String, Object>> formattedApps = applications.stream()
                .map(app -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", app.getId().toString());
                    map.put("jobId", app.getJobId() != null ? app.getJobId().toString() : null);
                    map.put("jobTitle", app.getRole());
                    map.put("company", app.getCompany());
                    map.put("location", app.getLocation());
                    map.put("status", app.getStatus() != null ? app.getStatus().name().toLowerCase() : "draft");
                    map.put("appliedAt", app.getAppliedAt() != null ? app.getAppliedAt().toString() : app.getCreatedAt().toString());
                    map.put("matchScore", app.getMatchScore());
                    map.put("notes", app.getNotes());
                    map.put("source", app.getSource());
                    map.put("applicationUrl", app.getApplicationUrl());
                    return map;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("applications", formattedApps));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{applicationId}")
    public ResponseEntity<?> getApplication(@PathVariable String applicationId) {
        try {
            UUID appUUID = UUID.fromString(applicationId);
            Optional<Application> appOpt = applicationRepository.findById(appUUID);
            
            if (appOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Application app = appOpt.get();
            Map<String, Object> map = new HashMap<>();
            map.put("id", app.getId().toString());
            map.put("userId", app.getUserId().toString());
            map.put("jobId", app.getJobId() != null ? app.getJobId().toString() : null);
            map.put("company", app.getCompany());
            map.put("role", app.getRole());
            map.put("location", app.getLocation());
            map.put("status", app.getStatus() != null ? app.getStatus().name().toLowerCase() : "draft");
            map.put("appliedAt", app.getAppliedAt() != null ? app.getAppliedAt().toString() : app.getCreatedAt().toString());
            map.put("notes", app.getNotes());
            map.put("source", app.getSource());
            map.put("applicationUrl", app.getApplicationUrl());
            map.put("matchScore", app.getMatchScore());
            
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{applicationId}")
    public ResponseEntity<?> updateApplication(@PathVariable String applicationId, @RequestBody UpdateApplicationRequest request) {
        try {
            UUID appUUID = UUID.fromString(applicationId);
            Optional<Application> appOpt = applicationRepository.findById(appUUID);
            
            if (appOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Application app = appOpt.get();
            
            if (request.company() != null) app.setCompany(request.company());
            if (request.role() != null) app.setRole(request.role());
            if (request.location() != null) app.setLocation(request.location());
            if (request.status() != null) app.setStatus(parseStatus(request.status()));
            if (request.notes() != null) app.setNotes(request.notes());
            if (request.applicationUrl() != null) app.setApplicationUrl(request.applicationUrl());
            if (request.matchScore() != null) app.setMatchScore(request.matchScore());
            
            Application saved = applicationRepository.save(app);
            
            return ResponseEntity.ok(Map.of(
                "id", saved.getId().toString(),
                "status", saved.getStatus() != null ? saved.getStatus().name() : "DRAFT",
                "message", "Application updated successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{applicationId}")
    public ResponseEntity<?> deleteApplication(@PathVariable String applicationId) {
        try {
            UUID appUUID = UUID.fromString(applicationId);
            applicationRepository.deleteById(appUUID);
            return ResponseEntity.ok(Map.of("message", "Application deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{applicationId}/submit")
    public ResponseEntity<?> submitApplication(@PathVariable String applicationId) {
        try {
            UUID appUUID = UUID.fromString(applicationId);
            Optional<Application> appOpt = applicationRepository.findById(appUUID);
            
            if (appOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Application app = appOpt.get();
            app.setStatus(ApplicationStatus.SUBMITTED);
            app.setSubmittedAt(Instant.now());
            Application saved = applicationRepository.save(app);
            
            return ResponseEntity.ok(Map.of(
                "applicationId", saved.getId().toString(),
                "status", saved.getStatus().name(),
                "message", "Application submitted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{applicationId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String applicationId, @RequestBody StatusUpdateRequest request) {
        try {
            UUID appUUID = UUID.fromString(applicationId);
            Optional<Application> appOpt = applicationRepository.findById(appUUID);
            
            if (appOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Application app = appOpt.get();
            app.setStatus(parseStatus(request.status()));
            Application saved = applicationRepository.save(app);
            
            return ResponseEntity.ok(Map.of(
                "applicationId", saved.getId().toString(),
                "status", saved.getStatus().name(),
                "message", "Status updated successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
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

    // Helper method to parse status string to enum
    private ApplicationStatus parseStatus(String status) {
        if (status == null) return ApplicationStatus.DRAFT;
        try {
            return ApplicationStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Map common status strings to enum
            return switch (status.toLowerCase()) {
                case "applied" -> ApplicationStatus.SUBMITTED;
                case "interview", "interviewing" -> ApplicationStatus.PARTIAL_ACTION_REQUIRED;
                case "offer", "offered", "hired" -> ApplicationStatus.READY;
                case "declined", "rejected", "withdrawn" -> ApplicationStatus.FAILED_NOT_SUBMITTED;
                default -> ApplicationStatus.DRAFT;
            };
        }
    }

    // Request Records
    public record CreateApplicationRequest(
    String userId,
    String jobId,
    String company,
    String role,
    String location,
    String status,
    String appliedAt,
    String notes,
    String source,
    String applicationUrl,
    Integer matchScore,
    String jobDescription 
) {}

    public record UpdateApplicationRequest(
        String company,
        String role,
        String location,
        String status,
        String notes,
        String applicationUrl,
        Integer matchScore
    ) {}

    public record StatusUpdateRequest(String status) {}
}