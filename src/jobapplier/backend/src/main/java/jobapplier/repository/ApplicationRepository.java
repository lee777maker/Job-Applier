package jobapplier.repository;

import jobapplier.model.Application;
import java.util.UUID;

public interface ApplicationRepository {
    void save(Application application);
    void update(Application application);
    Application findById(UUID id);
}
