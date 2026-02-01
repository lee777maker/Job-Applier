package jobapplier.repository;

import jobapplier.model.Task;
import java.util.UUID;

public interface TaskRepository {
    void save(Task task);
    void update(Task task);
    Task findById(UUID id);
}
