package jobapplier.recommendation;

import jobapplier.model.User;
import jobapplier.model.Job;
import java.util.List;

public interface JobRecommender {
    List<JobMatch> recommendJobs(User user, int limit);
    
    record JobMatch(Job job, double matchScore, List<String> matchingSkills) {}
}
