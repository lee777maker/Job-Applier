package jobapplier.ai;

import java.util.UUID;

public interface AIClient {
    AIResult generateCoverLetter(UUID applicationId);
    AIResult generateResume(UUID applicationId);
    AIResult calculateFitScore(UUID applicationId);
    AIResult generateOutreachEmail(UUID applicationId);
}
public record AIResult(AIStatus status, String content, String errorMessage){}

public enum AIStatus {
    SUCCESS,
    PARTIAL,
    FAILURE
}

