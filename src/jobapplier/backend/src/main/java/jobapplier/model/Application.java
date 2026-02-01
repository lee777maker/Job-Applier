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

    public Application(UUID id, UUID userId, UUID jobId, ApplicationStatus status, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.jobId = jobId;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getJobId() { return jobId; }
    public ApplicationStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getSubmittedAt() { return submittedAt; }

    public void setStatus(ApplicationStatus status) { this.status = status; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public boolean isReadyForSubmission() {
        return status == ApplicationStatus.DRAFT || status == ApplicationStatus.READY;
    }
}
