package jobapplier.model;

import java.util.UUID;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "resumes")
public class Resume {

    @Id
    @GeneratedValue
    private UUID id; 

    @OneToOne(fetch= FetchType.LAZY,optional = true)
    @JoinColumn(name = "user_id",unique=true ,nullable = true)
    private User user;

    private String fileName;
    private String contentType;
    private String filePath;
    private Instant uploadedAt;

    protected Resume() {}

    public Resume(UUID id, User user, String fileName, String filePath, Instant uploadedAt) {
        this.id = id;
        this.user = user;
        this.fileName = fileName;
        this.filePath = filePath;
        this.uploadedAt = uploadedAt;
    }
    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getFileName() { return fileName; }
    public String getContentType() { return contentType; }
    public String getFilePath() { return filePath; }
    public Instant getUploadedAt() { return uploadedAt; }

    public void setUser(User user) {
        this.user = user;
    }
}
