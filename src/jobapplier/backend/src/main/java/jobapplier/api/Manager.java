package jobapplier.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jobapplier.model.*;
import jobapplier.repository.*;
import jobapplier.ai.AIClient;
import jobapplier.ai.AIResult;
import jobapplier.audit.AuditService;
import jobapplier.workflow.ApplicationStatus;
import jobapplier.recommendation.*;

public class Manager {

    private final UserRepository userRepo;
    private final JobRepository jobRepo;
    private final ApplicationRepository applicationRepo;
    private final TaskRepository taskRepo;
    private final AuditService auditService;
    private final AIClient aiClient;
    private final JobRecommender jobRecommender;

    public Manager(
            UserRepository userRepo,
            JobRepository jobRepo,
            ApplicationRepository applicationRepo,
            TaskRepository taskRepo,
            AuditService auditService,
            AIClient aiClient,
            JobRecommender jobRecommender
    ) {
        this.userRepo = userRepo;
        this.jobRepo = jobRepo;
        this.applicationRepo = applicationRepo;
        this.taskRepo = taskRepo;
        this.auditService = auditService;
        this.aiClient = aiClient;
        this.jobRecommender = jobRecommender;
    }

    /* =========================
       AUTH
       ========================= */

    public User authenticate(String email, String rawPassword) {
        User user = userRepo.findByEmail(email);
        if (user == null || !user.verifyPassword(rawPassword)) {
            auditService.log("AUTH_FAILED", email);
            return null;
        }
        auditService.log("AUTH_SUCCESS", email);
        return user;
    }

    /* =========================
       PROFILE
       ========================= */

    public void saveProfile(User user) {
        userRepo.save(user);
        auditService.log("PROFILE_SAVED", user.getEmail());
    }

    /* =========================
       JOB INTAKE
       ========================= */

    public Job createJob(User user, String company, String title, String jobDescription, String jobUrl) {
        Job job = new Job(UUID.randomUUID(), company, title, jobDescription, jobUrl, Instant.now());
        jobRepo.save(job);
        auditService.log("JOB_CREATED", user.getEmail(), job.getId().toString());
        return job;
    }

    /* =========================
       APPLICATION
       ========================= */

    public Application createApplication(User user, Job job) {
        Application app = new Application(
                UUID.randomUUID(),
                user.getId(),
                job.getId(),
                ApplicationStatus.DRAFT,
                Instant.now()
        );
        applicationRepo.save(app);
        auditService.log("APPLICATION_CREATED", user.getEmail(), app.getId().toString());
        return app;
    }

    /* =========================
       AI TASKS
       ========================= */

    public Task generateCoverLetter(User user, Application app) {
        Task task = new Task(UUID.randomUUID(), app.getId(), Task.TaskType.COVER_LETTER, Task.TaskStatus.RUNNING);
        taskRepo.save(task);

        AIResult result = aiClient.generateCoverLetter(app.getId());

        handleAIResult(user, app, task, result);
        return task;
    }

    public Task generateResume(User user, Application app) {
        Task task = new Task(UUID.randomUUID(), app.getId(), Task.TaskType.RESUME, Task.TaskStatus.RUNNING);
        taskRepo.save(task);

        AIResult result = aiClient.generateResume(app.getId());

        handleAIResult(user, app, task, result);
        return task;
    }

    /* =========================
       APPLY / SUBMIT
       ========================= */

    public void submitApplication(User user, Application app) {
        if (!app.isReadyForSubmission()) {
            app.setStatus(ApplicationStatus.PARTIAL_ACTION_REQUIRED);
            applicationRepo.save(app);

            auditService.log(
                    "SUBMISSION_BLOCKED",
                    user.getEmail(),
                    "Application not ready"
            );
            return;
        }

        // IMPORTANT: actual submission happens here or via IntegrationService
        boolean submitted = false; // simulate V1 (manual apply)

        if (submitted) {
            app.setStatus(ApplicationStatus.SUBMITTED);
            app.setSubmittedAt(Instant.now());
            auditService.log("APPLICATION_SUBMITTED", user.getEmail(), app.getId().toString());
        } else {
            app.setStatus(ApplicationStatus.FAILED_NOT_SUBMITTED);
            auditService.log(
                    "APPLICATION_NOT_SUBMITTED",
                    user.getEmail(),
                    "Manual submission required"
            );
        }

        applicationRepo.save(app);
    }

    /* =========================
       INTERNAL HELPERS
       ========================= */

    private void handleAIResult(User user, Application app, Task task, AIResult result) {
        switch (result.status()) {
            case SUCCESS -> {
                task.setStatus(Task.TaskStatus.SUCCESS);
                auditService.log("AI_TASK_SUCCESS", task.getId().toString());
            }
            case PARTIAL -> {
                task.setStatus(Task.TaskStatus.PARTIAL);
                app.setStatus(ApplicationStatus.PARTIAL_ACTION_REQUIRED);
                auditService.log("AI_TASK_PARTIAL", task.getId().toString());
            }
            case FAILURE -> {
                task.setStatus(Task.TaskStatus.FAILED);
                app.setStatus(ApplicationStatus.FAILED_NOT_SUBMITTED);
                auditService.log("AI_TASK_FAILED", task.getId().toString());
            }
        }

        taskRepo.save(task);
        applicationRepo.save(app);
    }
    /* =========================
       Job RECOMMENDATION
       ========================= */

       public List<JobRecommender.JobMatch> recommendJobsForUser(User user, int limit) {
           List<JobRecommender.JobMatch> recommendations = jobRecommender.recommendJobs(user, limit);
           auditService.log("JOB_RECOMMENDATIONS_GENERATED", user.getEmail(), String.valueOf(recommendations.size()));
           return recommendations;
       }
}
