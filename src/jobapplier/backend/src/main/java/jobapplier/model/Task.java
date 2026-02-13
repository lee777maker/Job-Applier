package jobapplier.model;

import java.util.UUID;
import jakarta.persistence.*;  // ADD THIS

@Entity  // ADD THIS
@Table(name = "tasks")  // ADD THIS
public class Task {
    
    @Id  // ADD THIS
    @GeneratedValue  // ADD THIS (or remove if you set UUID manually)
    private UUID id;
    
    @Column(name = "application_id")  // ADD THIS
    private UUID applicationId;
    
    @Enumerated(EnumType.STRING)  // ADD THIS
    @Column(name = "task_type")   // ADD THIS
    private TaskType taskType;
    
    @Enumerated(EnumType.STRING)  // ADD THIS
    @Column(name = "status")      // ADD THIS
    private TaskStatus status;
    
    @Column(name = "result", length = 1000)  // ADD THIS
    private String result;

    // Default constructor required by JPA
    protected Task() {}  // ADD THIS

    public Task(UUID id, UUID applicationId, TaskType taskType, TaskStatus status) {
        this.id = id;
        this.applicationId = applicationId;
        this.taskType = taskType;
        this.status = status;
    }

    // Getters and setters remain the same
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