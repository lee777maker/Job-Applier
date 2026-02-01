package jobapplier.model;

import java.util.UUID;

public class Task {
    private final UUID id;
    private final UUID applicationId;
    private final TaskType taskType;
    private TaskStatus status;
    private String result;

    public Task(UUID id, UUID applicationId, TaskType taskType, TaskStatus status) {
        this.id = id;
        this.applicationId = applicationId;
        this.taskType = taskType;
        this.status = status;
    }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public TaskType getTaskType() { return taskType; }
    public TaskStatus getStatus() { return status; }
    public String getResult() { return result; }

    public void setStatus(TaskStatus status) { this.status = status; }
    public void setResult(String result) { this.result = result; }

    public enum TaskType {
        COVER_LETTER,
        RESUME,
        FIT_SCORE,
        OUTREACH_EMAIL
    }

    public enum TaskStatus {
        PENDING,
        RUNNING,
        SUCCESS,
        PARTIAL,
        FAILED
    }
}
