package jobapplier.model;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity
@Table(name = "jobs")

public class Job {
    
    @Id
    private final UUID id;
    private String company;
    private String title;
    private String jobDescription;
    private String jobUrl;
    private final Instant createdAt;

    public Job(UUID id, String company, String title, String jobDescription, String jobUrl, Instant createdAt) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        if (jobDescription == null || jobDescription.isBlank())
            throw new IllegalArgumentException("jobDescription cannot be blank");
        this.id = id;
        this.company = company;
        this.title = title;
        this.jobDescription = jobDescription;
        this.jobUrl = jobUrl;
        this.createdAt = createdAt == null ? Instant.now() : createdAt;
    }

    public UUID getId() { return id; }
    public String getCompany() { return company; }
    public String getTitle() { return title; }
    public String getJobDescription() { return jobDescription; }
    public String getJobUrl() { return jobUrl; }
    public Instant getCreatedAt() { return createdAt; }

    public void setCompany(String company) { this.company = company; }
    public void setTitle(String title) { this.title = title; }

    public void setJobDescription(String jobDescription) {
        if (jobDescription == null || jobDescription.isBlank())
            throw new IllegalArgumentException("jobDescription cannot be blank");
        this.jobDescription = jobDescription;
    }

    public void setJobUrl(String jobUrl) { this.jobUrl = jobUrl; }
}
