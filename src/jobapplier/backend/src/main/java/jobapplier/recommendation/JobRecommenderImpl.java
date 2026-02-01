package jobapplier.recommendation;

import jobapplier.model.User;
import jobapplier.model.Job;
import jobapplier.repository.JobRepository;
import jobapplier.ai.AIClient;
import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;

public class JobRecommenderImpl implements JobRecommender {
    
    private final JobRepository jobRepository;
    private final AIClient aiClient; // For AI-powered matching
    
    public JobRecommenderImpl(JobRepository jobRepository, AIClient aiClient) {
        this.jobRepository = jobRepository;
        this.aiClient = aiClient;
    }
    
    @Override
    public List<JobMatch> recommendJobs(User user, int limit) {
        // In V1: Simple keyword matching
        // In future: Integrate with AI for semantic matching
        
        List<JobMatch> recommendations = new ArrayList<>();
        
        // TODO: Get all jobs from repository
        // For now, return empty list - you'll need to implement job fetching
        // and matching logic
        
        // Example logic:
        // 1. Extract skills from user profile (need to add skills to User model)
        // 2. Fetch all available jobs
        // 3. Calculate match score based on skills overlap
        // 4. Sort by score and return top N
        
        return recommendations.stream()
                .sorted(Comparator.comparingDouble(JobMatch::matchScore).reversed())
                .limit(limit)
                .toList();
    }
    
    private double calculateMatchScore(User user, Job job) {
        // Simple implementation - count keyword matches
        // Later: Use AI for semantic matching
        
        String userSkills = extractSkillsFromUser(user); // Need to implement
        String jobDescription = job.getJobDescription().toLowerCase();
        
        long matches = userSkills.lines()
                .filter(skill -> jobDescription.contains(skill.toLowerCase()))
                .count();
        
        return (double) matches / 10.0; // Normalize score 0-1
    }
    
    private String extractSkillsFromUser(User user) {
        // TODO: Extract skills from user's profile
        // This could come from:
        // - Resume parsing
        // - User-entered skills
        // - LinkedIn profile integration
        
        return "";
    }
}
