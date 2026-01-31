package jobapplier.audit;

public class AuditService {
    public void log(String event, String... meta) {
        // V1: print audit logs. Later: write to DB.
        System.out.println("[AUDIT] " + event + " | " + String.join(" | ", meta));
    }
}

