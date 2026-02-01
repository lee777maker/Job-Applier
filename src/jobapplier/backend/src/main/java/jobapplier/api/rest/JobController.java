package jobapplier.api.rest;

import jobapplier.api.Manager;
import jobapplier.model.Job;
import jobapplier.model.User;
import jobapplier.recommendation.JobRecommender;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class JobController {

    private final Manager manager;

    public JobController(Manager manager) {
        this.manager = manager;
    }

    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<?> getRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "10") int limit) {
        
        // Get recommendations from manager
        List<JobRecommender.JobMatch> recommendations = manager.recommendJobsForUser(
            null, // Would fetch user from repository in real impl
            limit
        );
        
        // For now, return mock data
        return ResponseEntity.ok(Map.of(
            "jobs", new Object[]{
                Map.of(
                    "id", "1",
                    "title", "Graduate Software Engineer",
                    "company", "BT",
                    "location", "London, UK",
                    "applicationUrl", "https://linkedin.com/jobs/1",
                    "matchScore", 0.92
                ),
                Map.of(
                    "id", "2",
                    "title", "Agentic Engineer",
                    "company", "Deloitte",
                    "location", "New York, USA",
                    "applicationUrl", "https://linkedin.com/jobs/2",
                    "matchScore", 0.88
                ),
                Map.of(
                    "id", "3",
                    "title", "Junior Automation Engineer",
                    "company", "Lectra",
                    "location", "Paris, France",
                    "applicationUrl", "https://linkedin.com/jobs/3",
                    "matchScore", 0.85
                )
            }
        ));
    }

    @PostMapping
    public ResponseEntity<?> createJob(@RequestBody CreateJobRequest request) {
        // In real implementation, create job via manager
        return ResponseEntity.ok(Map.of(
            "id", UUID.randomUUID().toString(),
            "message", "Job created successfully"
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchJobs(@RequestParam String query) {
        // Search jobs implementation
        return ResponseEntity.ok(Map.of(
            "query", query,
            "results", new Object[]{}
        ));
    }

    // Request Records
    public record CreateJobRequest(
        String company,
        String title,
        String jobDescription,
        String jobUrl
    ) {}
}
