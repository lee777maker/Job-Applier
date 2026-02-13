package jobapplier.repository;

import jobapplier.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {
    // Spring Data provides save(), findById(), findAll() automatically
}