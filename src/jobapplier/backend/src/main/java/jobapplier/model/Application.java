package jobapplier.model;

import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;
import jobapplier.workflow.ApplicationStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "applications")
public class Application {
    
    @Id
    @Column(name = "id")
    private UUID id;
    
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    
    @Column(name = "job_id")
    private UUID jobId;
    
    @Column(name = "company", nullable = false)
    private String company;
    
    @Column(name = "role", nullable = false)
    private String role;
    
    @Column(name = "location")
    private String location;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ApplicationStatus status;
    
    @Column(name = "applied_at")
    private Instant appliedAt;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "source")
    private String source;
    
    @Column(name = "application_url")
    private String applicationUrl;
    
    @Column(name = "match_score")
    private Integer matchScore;
    
    @Column(name = "created_at")
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    private Instant submittedAt;

    // Default constructor - required by JPA
    public Application() {
        this.id = UUID.randomUUID();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.status = ApplicationStatus.DRAFT;
    }

    // Legacy constructor for backward compatibility
    public Application(UUID id, UUID userId, UUID jobId, ApplicationStatus status, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.jobId = jobId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = Instant.now();
    }

    // Constructor with required fields
    public Application(UUID userId, String company, String role) {
        this();
        this.userId = userId;
        this.company = company;
        this.role = role;
        this.appliedAt = Instant.now();
    }

    // Full constructor
    public Application(UUID id, UUID userId, UUID jobId, String company, String role, 
                       String location, ApplicationStatus status, Instant appliedAt, String notes,
                       String source, String applicationUrl, Integer matchScore,
                       Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.jobId = jobId;
        this.company = company;
        this.role = role;
        this.location = location;
        this.status = status;
        this.appliedAt = appliedAt;
        this.notes = notes;
        this.source = source;
        this.applicationUrl = applicationUrl;
        this.matchScore = matchScore;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getJobId() { return jobId; }
    public void setJobId(UUID jobId) { this.jobId = jobId; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public Instant getAppliedAt() { return appliedAt; }
    public void setAppliedAt(Instant appliedAt) { this.appliedAt = appliedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getApplicationUrl() { return applicationUrl; }
    public void setApplicationUrl(String applicationUrl) { this.applicationUrl = applicationUrl; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    // Helper methods
    public boolean isActive() {
        if (status == null) return false;
        return !Arrays.asList(
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.FAILED_NOT_SUBMITTED
        ).contains(status);
    }

    public boolean isReadyForSubmission() {
        return status == ApplicationStatus.DRAFT || status == ApplicationStatus.READY;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}