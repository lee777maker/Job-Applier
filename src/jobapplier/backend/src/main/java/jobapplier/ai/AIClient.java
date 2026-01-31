package jobapplier.ai;

import java.util.UUID;

public interface AIClient {
    AIResult generateCoverLetter(UUID applicationId);
    AIResult generateResume(UUID applicationId);
}

