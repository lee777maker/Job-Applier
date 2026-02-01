package jobapplier.audit;

public interface AuditService {
    void log(String event, String userId);
    void log(String event, String userId, String details);
}
