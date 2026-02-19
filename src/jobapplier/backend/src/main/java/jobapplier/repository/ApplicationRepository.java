package jobapplier.repository;

import jobapplier.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    
    List<Application> findByUserId(UUID userId);
    
    List<Application> findByUserIdOrderByAppliedAtDesc(UUID userId);
    
    List<Application> findByUserIdOrderByAppliedAtAsc(UUID userId);
    
    List<Application> findByUserIdAndAppliedAtAfter(UUID userId, Instant appliedAt);
    
    @Query("SELECT a FROM Application a WHERE a.userId = :userId AND a.status = :status")
    List<Application> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") String status);
    
    @Query("SELECT COUNT(a) FROM Application a WHERE a.userId = :userId")
    long countByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.userId = :userId GROUP BY a.status")
    List<Object[]> getStatusCountsByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT AVG(a.matchScore) FROM Application a WHERE a.userId = :userId AND a.matchScore IS NOT NULL")
    Double getAverageMatchScoreByUserId(@Param("userId") UUID userId);
}