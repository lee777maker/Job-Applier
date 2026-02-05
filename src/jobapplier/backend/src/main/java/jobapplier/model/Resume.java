package jobapplier.model;
import java.lang.annotation.Inherited;
import java.util.UUID;
import jakarta.persistence.*;
import java.time.Instant;


@Entity
@Table(name = "resumes")


public class Resume {
    @Id 
    private final UUID id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)

    private User user;
    private String fileName;
    private String contentType;
    private String filePath;
    private Instant uploadedAt;

    public Resume(UUID id, User user, String fileName, String filePath, Instant uploadedAt) {
        this.id = id;
        this.user = user;
        this.fileName = fileName;
        this.filePath = filePath;
        this.uploadedAt = uploadedAt;
    }

    //Getters
    public UUID getId() {
        return id;
    }
    public User getUser() {
        return user;
    }
    public String getFileName() {
        return fileName;}

    public String getFilePath() {
        return filePath;
    }
    public Instant getUploadedAt() {
        return uploadedAt;
    }

    //Setters
    public void setUser(User user) {
        this.user = user;
    }
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
    

    
}
