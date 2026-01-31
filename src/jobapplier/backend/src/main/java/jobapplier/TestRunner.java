package jobapplier;

import java.util.UUID;

import jobapplier.model.*;
import jobapplier.workflow.ApplicationStatus;

public class TestRunner {

    private static void assertTrue(boolean condition, String message) {
        if (!condition) throw new AssertionError("❌ " + message);
        System.out.println("✅ " + message);
    }

    public static void main(String[] args) {

        // 1) User password hashing + verification
        User user = new User(
                UUID.randomUUID(),
                "Lethabo",
                "Neo",
                "lethabo@example.com",
                "pass123"
        );

        assertTrue(user.verifyPassword("pass123"), "Password verifies correctly");
        assertTrue(!user.verifyPassword("wrong"), "Wrong password fails");

        // 2) Job creation
        Job job = new Job(
                UUID.randomUUID(),
                "Monocle",
                "Software Engineer",
                "We need Java, SQL, and teamwork.",
                "https://example.com/job",
                null
        );

        assertTrue(job.getJobDescription().contains("Java"), "Job description stored");

        // 3) Application status logic
        Application app = new Application(
                UUID.randomUUID(),
                user.getId(),
                job.getId(),
                ApplicationStatus.DRAFT,
                null
        );

        assertTrue(app.getStatus() == ApplicationStatus.DRAFT, "Application starts in DRAFT");
        assertTrue(!app.isReadyForSubmission(), "DRAFT is not ready to submit");

        app.setStatus(ApplicationStatus.READY_TO_SUBMIT);
        assertTrue(app.isReadyForSubmission(), "READY_TO_SUBMIT is ready");

        // 4) Task status transitions
        Task task = new Task(
                UUID.randomUUID(),
                app.getId(),
                TaskType.COVER_LETTER,
                TaskStatus.PENDING
        );

        assertTrue(task.getStatus() == TaskStatus.PENDING, "Task starts PENDING");
        task.setStatus(TaskStatus.RUNNING);
        assertTrue(task.getCompletedAt() == null, "RUNNING does not set completedAt");

        task.setStatus(TaskStatus.SUCCESS);
        assertTrue(task.getCompletedAt() != null, "SUCCESS sets completedAt");

        System.out.println("\n🎉 All tests passed.");
    }
}

