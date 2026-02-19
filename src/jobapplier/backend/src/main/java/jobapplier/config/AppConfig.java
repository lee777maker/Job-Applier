package jobapplier.config;

import jobapplier.ai.AIClient;
import jobapplier.api.Manager;
import jobapplier.audit.AuditService;
import jobapplier.recommendation.JobRecommender;
import jobapplier.recommendation.JobRecommenderImpl;
import jobapplier.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class AppConfig {

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    // Repositories are now auto-implemented by Spring Data JPA


    @Bean
    public AuditService auditService() {
        return new AuditService() {
            @Override
            public void log(String event, String userId) {
                System.out.println("[AUDIT] " + event + " - User: " + userId);
            }
            
            @Override
            public void log(String event, String userId, String details) {
                System.out.println("[AUDIT] " + event + " - User: " + userId + " - " + details);
            }
        };
    }

    @Bean
    public AIClient aiClient() {
        return new AIClient() {
            @Override
            public jobapplier.ai.AIResult generateCoverLetter(java.util.UUID applicationId) {
                return new jobapplier.ai.AIResult(
                    jobapplier.ai.AIStatus.SUCCESS, 
                    "Cover letter generated", 
                    null
                );
            }
            
            @Override
            public jobapplier.ai.AIResult generateResume(java.util.UUID applicationId) {
                return new jobapplier.ai.AIResult(
                    jobapplier.ai.AIStatus.SUCCESS, 
                    "Resume generated", 
                    null
                );
            }
            
            @Override
            public jobapplier.ai.AIResult calculateFitScore(java.util.UUID applicationId) {
                return new jobapplier.ai.AIResult(
                    jobapplier.ai.AIStatus.SUCCESS, 
                    "0.85", 
                    null
                );
            }
            
            @Override
            public jobapplier.ai.AIResult generateOutreachEmail(java.util.UUID applicationId) {
                return new jobapplier.ai.AIResult(
                    jobapplier.ai.AIStatus.SUCCESS, 
                    "Email generated", 
                    null
                );
            }
        };
    }

    @Bean
    public JobRecommender jobRecommender(JobRepository jobRepository, AIClient aiClient) {
        return new JobRecommenderImpl(jobRepository, aiClient);
    }

    @Bean
    public Manager manager(
            UserRepository userRepo,
            JobRepository jobRepo,
            ApplicationRepository applicationRepo,
            TaskRepository taskRepo,
            AuditService auditService,
            AIClient aiClient,
            JobRecommender jobRecommender) {
        return new Manager(userRepo, jobRepo, applicationRepo, taskRepo, auditService, aiClient, jobRecommender);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
            .baseUrl(aiServiceUrl)
            .build();
    }
}