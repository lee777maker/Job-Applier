package jobapplier.repository;

import jobapplier.model.Application;
import java.util.List;
import java.util.UUID;

public interface ApplicationRepository {
    void save(Application app);
    void update(Application app);
    Application findById(UUID id);
    List<Application> findByUserId(UUID userId);
}
