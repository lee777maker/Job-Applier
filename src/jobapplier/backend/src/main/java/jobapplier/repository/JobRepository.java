package jobapplier.repository;

import jobapplier.model.Job;
import java.util.List;
import java.util.UUID;

public interface JobRepository {
    void save(Job job);
    Job findById(UUID id);
    List<Job> findAll();
}
