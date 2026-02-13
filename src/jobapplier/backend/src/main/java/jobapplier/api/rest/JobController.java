package jobapplier.api.rest;

import jobapplier.api.JobSpyClient;
import jobapplier.api.Manager;
import jobapplier.model.User;
import jobapplier.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class JobController {

    private final Manager manager;
    private final JobSpyClient jobSpyClient;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JobController(Manager manager, JobSpyClient jobSpyClient, UserRepository userRepository) {
        this.manager = manager;
        this.jobSpyClient = jobSpyClient;
        this.userRepository = userRepository;
    }

    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<?> getRecommendations(@PathVariable String userId) {
        try {
            User user = userRepository.findById(UUID.fromString(userId)).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            // Get user preferences from profile
            String preferredRole = extractRoleFromProfile(user);
            String location = extractLocationFromProfile(user);
            boolean remote = isRemotePreferred(user);
            String jobType = extractJobTypeFromProfile(user);

            // Call JobSpy
            List<JobSpyClient.JobListing> jobs = jobSpyClient.searchJobs(
                new JobSpyClient.JobSearchCriteria(
                    preferredRole,
                    location,
                    remote,
                    jobType
                )
            );

            // Format response for frontend
            List<Map<String, Object>> formattedJobs = jobs.stream()
                .map(job -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", job.id());
                    map.put("title", job.title());
                    map.put("company", job.company());
                    map.put("location", job.location());
                    map.put("description", job.description().substring(0, Math.min(200, job.description().length())) + "...");
                    map.put("applicationUrl", job.applyUrl());
                    map.put("matchScore", calculateMatchScore(job, user));
                    map.put("salary", job.salary() != null ? job.salary() : "Not disclosed");
                    map.put("postedAt", job.datePosted());
                    map.put("jobType", job.jobType() != null ? job.jobType() : "fulltime");
                    map.put("source", job.source());
                    return map;
                })
                .collect(Collectors.toList());  // Use collect instead of toList()

            return ResponseEntity.ok(Map.of("jobs", formattedJobs));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of(
                "jobs", List.of(),
                "error", "Failed to fetch jobs: " + e.getMessage()
            ));
        }
    }

    // Helper methods to extract preferences from user profile
    private String extractRoleFromProfile(User user) {
        // Parse profile_data JSON to get preferred role
        // Fallback to "software engineer" if not found
        try {
            if (user.getProfileData() != null) {
                JsonNode root = objectMapper.readTree(user.getProfileData());
                JsonNode role = root.path("preferredRole");
                if (!role.isMissingNode()) return role.asText();
            }
        } catch (Exception e) {
            System.err.println("Failed to parse role: " + e.getMessage());
        }
        return "software engineer"; // fallback
    }

    private String extractLocationFromProfile(User user) {
        try {
            if (user.getProfileData() != null) {
                JsonNode root = objectMapper.readTree(user.getProfileData());
                JsonNode loc = root.path("location");
                if (!loc.isMissingNode()) {
                    return mapLocationToJobSpy(loc.asText());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse location: " + e.getMessage());
        }
        return "Johannesburg";
    }

    private String mapLocationToJobSpy(String locationId) {
        // Map frontend location IDs to JobSpy format
        return switch(locationId) {
            case "johannesburg" -> "Johannesburg, Gauteng";
            case "cape-town" -> "Cape Town, Western Cape";
            case "durban" -> "Durban, KwaZulu-Natal";
            case "pretoria" -> "Pretoria, Gauteng";
            case "port-elizabeth" -> "Port Elizabeth, Eastern Cape";
            case "bloemfontein" -> "Bloemfontein, Free State";
            default -> "Johannesburg, South Africa";
        };
    }


    private boolean isRemotePreferred(User user) {
        try {
            if (user.getProfileData() != null) {
                JsonNode root = objectMapper.readTree(user.getProfileData());
                return root.path("openToRemote").asBoolean(false);
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    private String extractJobTypeFromProfile(User user) {
        try {
            if (user.getProfileData() != null) {
                JsonNode root = objectMapper.readTree(user.getProfileData());
                JsonNode types = root.path("contractTypes");
                if (types.isArray() && types.size() > 0) {
                    return types.get(0).asText(); // Get first contract type
                }
            }
        } catch (Exception e) {
            return "full-time";
        }
        return "full-time";
    }


    private double calculateMatchScore(JobSpyClient.JobListing job, User user) {
        // Simple matching algorithm - you can improve this
        double score = 0.7; // Base score
        
        // Boost score if job title matches user's preferred role
        String userProfile = user.getProfileData() != null ? user.getProfileData().toLowerCase() : "";
        String jobTitle = job.title().toLowerCase();
        
        if (userProfile.contains(jobTitle) || jobTitle.contains(extractRoleFromProfile(user).toLowerCase())) {
            score += 0.2;
        }
        
        // Cap at 0.98
        return Math.min(score, 0.98);
    }

    @PostMapping
    public ResponseEntity<?> createJob(@RequestBody CreateJobRequest request) {
        return ResponseEntity.ok(Map.of(
            "id", UUID.randomUUID().toString(),
            "message", "Job created successfully"
        ));
    }

    public record CreateJobRequest(
        String company,
        String title,
        String jobDescription,
        String jobUrl
    ) {}
}