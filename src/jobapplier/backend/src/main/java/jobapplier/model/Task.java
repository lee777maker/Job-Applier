
package jobapplier.model;

import java.time.Instant;
import java.util.UUID;

public class Task {
    private final UUID id;
    private final UUID applicationId;

    private final TaskType type;
    private TaskStatus status;

    private final Instant createdAt;
    private Instant completedAt;

    // V1: store results as JSON text (later: separate Artifact table)
    private String resultJson;
    private String errorMessage;

    public Task(UUID id, UUID applicationId, TaskType type, TaskStatus status) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        if (applicationId == null) throw new IllegalArgumentException("applicationId cannot be null");
        if (type == null) throw new IllegalArgumentException("type cannot be null");

        this.id = id;
        this.applicationId = applicationId;
        this.type = type;
        this.status = status == null ? TaskStatus.PENDING : status;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public TaskType getType() { return type; }
    public TaskStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }
    public String getResultJson() { return resultJson; }
    public String getErrorMessage() { return errorMessage; }

    public void setStatus(TaskStatus status) {
        if (status == null) throw new IllegalArgumentException("status cannot be null");
        this.status = status;
        if (status == TaskStatus.SUCCESS || status == TaskStatus.PARTIAL || status == TaskStatus.FAILED) {
            this.completedAt = Instant.now();
        }
    }

    public void setResultJson(String resultJson) { this.resultJson = resultJson; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

