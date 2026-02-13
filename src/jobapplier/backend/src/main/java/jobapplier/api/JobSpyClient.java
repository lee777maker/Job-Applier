package jobapplier.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class JobSpyClient {

    @Value("${jobspy.service.url:http://jobspy-service:8002}")
    private String jobSpyUrl;
    
    private final RestTemplate restTemplate;
    public JobSpyClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<JobListing> searchJobs(JobSearchCriteria criteria) {
        try {
            JobSpyRequest request = new JobSpyRequest(
                criteria.keyword(),
                criteria.location(),
                criteria.remote(),
                criteria.jobType(),
                20,  // max results
                30,  // days old (last month)
                List.of("indeed")  // Indeed has best SA coverage
            );
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<JobSpyRequest> entity = new HttpEntity<>(request, headers);
            
            JobListing[] response = restTemplate.postForObject(
                jobSpyUrl + "/search",
                entity,
                JobListing[].class
            );
            
            return response != null ? List.of(response) : List.of();
            
        } catch (Exception e) {
            System.err.println("JobSpy search failed: " + e.getMessage());
            return List.of();
        }
    }

    // Request/Response Records
    public record JobSpyRequest(
        String keyword,
        String location,
        boolean remote,
        @JsonProperty("job_type") String jobType,
        @JsonProperty("max_results") int maxResults,
        @JsonProperty("days_old") int daysOld,
        List<String> sites
    ) {}

    public record JobListing(
        String id,
        String title,
        String company,
        String location,
        String description,
        @JsonProperty("apply_url") String applyUrl,
        @JsonProperty("date_posted") String datePosted,
        @JsonProperty("job_type") String jobType,
        String salary,
        String source
    ) {}
    
    public record JobSearchCriteria(
        String keyword,
        String location,
        boolean remote,
        String jobType
    ) {}
}
