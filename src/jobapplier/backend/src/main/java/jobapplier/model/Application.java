package jobapplier.model;

import java.time.Instant;
import java.util.UUID;
import jobapplier.workflow.ApplicationStatus;

public class Application {
    private final UUID id;
    private final UUID userId;
    private final UUID jobId;

    private ApplicationStatus status;
    private final Instant createdAt;
    private Instant submittedAt;

    // Optional scoring fields
    private Integer fitScore;     // 0..100
    private Double confidence;    // 0..1
    private String gapsJson;      // store as JSON string for now (V1)

    public Application(UUID id, UUID userId, UUID jobId, ApplicationStatus status, Instant createdAt) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        if (jobId == null) throw new IllegalArgumentException("jobId cannot be null");

        this.id = id;
        this.userId = userId;
        this.jobId = jobId;
        this.status = status == null ? ApplicationStatus.DRAFT : status;
        this.createdAt = createdAt == null ? Instant.now() : createdAt;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getJobId() { return jobId; }
    public ApplicationStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getSubmittedAt() { return submittedAt; }

    public Integer getFitScore() { return fitScore; }
    public Double getConfidence() { return confidence; }
    public String getGapsJson() { return gapsJson; }

    public void setStatus(ApplicationStatus status) {
        if (status == null) throw new IllegalArgumentException("status cannot be null");
        this.status = status;
    }

    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public void setFitScore(Integer fitScore) {
        if (fitScore != null && (fitScore < 0 || fitScore > 100))
            throw new IllegalArgumentException("fitScore must be 0..100");
        this.fitScore = fitScore;
    }

    public void setConfidence(Double confidence) {
        if (confidence != null && (confidence < 0.0 || confidence > 1.0))
            throw new IllegalArgumentException("confidence must be 0..1");
        this.confidence = confidence;
    }

    public void setGapsJson(String gapsJson) { this.gapsJson = gapsJson; }

    /**
     * Keep this conservative. In V1, "ready" can mean:
     * - The user has approved required artifacts OR
     * - You have enough fields to submit via an integration.
     */
    public boolean isReadyForSubmission() {
        return status == ApplicationStatus.READY_TO_SUBMIT;
    }
}

