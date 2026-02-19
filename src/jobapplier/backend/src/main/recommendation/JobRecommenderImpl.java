package jobapplier.recommendation;

import jobapplier.model.User;
import jobapplier.model.Job;
import jobapplier.repository.JobRepository;
import jobapplier.ai.AIClient;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

public class JobRecommenderImpl implements JobRecommender {
    
    private final JobRepository jobRepository;
    private final AIClient aiClient;
    private final WebClient webClient; 
    
    public JobRecommenderImpl(JobRepository jobRepository, AIClient aiClient, WebClient webClient) {
        this.jobRepository = jobRepository;
        this.aiClient = aiClient;
        this.webClient = webClient; 
    }
    
    @Override
    public List<JobMatch> recommendJobs(User user, int limit) {
        try {
            // Call jobspy-service with profile data
            Map<String, Object> response = webClient.post()
                .uri("http://jobspy-service:8002/search-by-profile")
                .bodyValue(Map.of(
                    "profile", Map.of(
                        "skills", user.getSkills(),
                        "suggestedJobTitles", user.getSuggestedJobTitles(),
                        "location", user.getPreferredLocation()
                    ),
                    "preferences", Map.of(
                        "preferredRole", user.getPreferredRole(),
                        "openToRemote", user.isOpenToRemote(),
                        "contractTypes", user.getContractTypes()
                    ),
                    "max_results", limit
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
                
            if (response == null || !response.containsKey("jobs")) {
                return List.of();
            }
            
            List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.get("jobs");
            return jobs.stream()
                .map(job -> new JobMatch(
                    convertToJobEntity(job),
                    ((Number) job.getOrDefault("match_score", 0.0)).doubleValue(),
                    (List<String>) job.getOrDefault("matching_skills", List.of())
                ))
                .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return List.of(); // Return empty on error
        }
    }
    
    private Job convertToJobEntity(Map<String, Object> jobData) {
        // Convert map to Job entity
        Job job = new Job();
        job.setId(java.util.UUID.fromString((String) jobData.get("id")));
        job.setTitle((String) jobData.get("title"));
        job.setCompany((String) jobData.get("company"));
        job.setLocation((String) jobData.get("location"));
        job.setJobDescription((String) jobData.get("description"));
        job.setApplicationUrl((String) jobData.get("apply_url"));
        return job;
    }
}