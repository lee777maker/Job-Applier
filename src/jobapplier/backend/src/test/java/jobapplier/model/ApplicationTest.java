package jobapplier.model;

import jobapplier.workflow.ApplicationStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Application entity.
 * Tests cover application creation, status management, and lifecycle methods.
 */
class ApplicationTest {

    private UUID testUserId;
    private static final String TEST_COMPANY = "Google";
    private static final String TEST_ROLE = "Software Engineer";

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    @Test
    @DisplayName("Should create application with default constructor")
    void shouldCreateApplicationWithDefaultConstructor() {
        Application app = new Application();

        assertAll("Default application",
            () -> assertNotNull(app.getId()),
            () -> assertNotNull(app.getCreatedAt()),
            () -> assertNotNull(app.getUpdatedAt()),
            () -> assertEquals(ApplicationStatus.DRAFT, app.getStatus())
        );
    }

    @Test
    @DisplayName("Should create application with required fields")
    void shouldCreateApplicationWithRequiredFields() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        assertAll("Application with required fields",
            () -> assertNotNull(app.getId()),
            () -> assertEquals(testUserId, app.getUserId()),
            () -> assertEquals(TEST_COMPANY, app.getCompany()),
            () -> assertEquals(TEST_ROLE, app.getRole()),
            () -> assertNotNull(app.getAppliedAt()),
            () -> assertEquals(ApplicationStatus.DRAFT, app.getStatus())
        );
    }

    @Test
    @DisplayName("Should create application with all fields")
    void shouldCreateApplicationWithAllFields() {
        UUID id = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();
        Instant now = Instant.now();
        Instant appliedAt = now.minusSeconds(86400); // 1 day ago

        Application app = new Application(
            id,
            testUserId,
            jobId,
            TEST_COMPANY,
            TEST_ROLE,
            "Johannesburg",
            ApplicationStatus.INTERVIEWING,
            appliedAt,
            "Applied via referral",
            "referral",
            "https://careers.google.com/job/123",
            85,
            now,
            now
        );

        assertAll("Full application",
            () -> assertEquals(id, app.getId()),
            () -> assertEquals(testUserId, app.getUserId()),
            () -> assertEquals(jobId, app.getJobId()),
            () -> assertEquals(TEST_COMPANY, app.getCompany()),
            () -> assertEquals(TEST_ROLE, app.getRole()),
            () -> assertEquals("Johannesburg", app.getLocation()),
            () -> assertEquals(ApplicationStatus.INTERVIEWING, app.getStatus()),
            () -> assertEquals(appliedAt, app.getAppliedAt()),
            () -> assertEquals("Applied via referral", app.getNotes()),
            () -> assertEquals("referral", app.getSource()),
            () -> assertEquals("https://careers.google.com/job/123", app.getApplicationUrl()),
            () -> assertEquals(85, app.getMatchScore())
        );
    }

    // =========================================================================
    // Status Management Tests
    // =========================================================================

    @Test
    @DisplayName("Should update status")
    void shouldUpdateStatus() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        app.setStatus(ApplicationStatus.READY);

        assertEquals(ApplicationStatus.READY, app.getStatus());
    }

    @Test
    @DisplayName("Should be active when status is not submitted or failed")
    void shouldBeActiveWhenStatusIsNotSubmittedOrFailed() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        assertTrue(app.isActive());

        app.setStatus(ApplicationStatus.READY);
        assertTrue(app.isActive());

        app.setStatus(ApplicationStatus.PARTIAL_ACTION_REQUIRED);
        assertTrue(app.isActive());
    }

    @Test
    @DisplayName("Should not be active when status is submitted")
    void shouldNotBeActiveWhenStatusIsSubmitted() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);
        app.setStatus(ApplicationStatus.SUBMITTED);

        assertFalse(app.isActive());
    }

    @Test
    @DisplayName("Should not be active when status is failed")
    void shouldNotBeActiveWhenStatusIsFailed() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);
        app.setStatus(ApplicationStatus.FAILED_NOT_SUBMITTED);

        assertFalse(app.isActive());
    }

    @Test
    @DisplayName("Should not be active when status is null")
    void shouldNotBeActiveWhenStatusIsNull() {
        Application app = new Application();
        app.setStatus(null);

        assertFalse(app.isActive());
    }

    @Test
    @DisplayName("Should be ready for submission when status is draft")
    void shouldBeReadyForSubmissionWhenStatusIsDraft() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        assertTrue(app.isReadyForSubmission());
    }

    @Test
    @DisplayName("Should be ready for submission when status is ready")
    void shouldBeReadyForSubmissionWhenStatusIsReady() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);
        app.setStatus(ApplicationStatus.READY);

        assertTrue(app.isReadyForSubmission());
    }

    @Test
    @DisplayName("Should not be ready for submission when status is submitted")
    void shouldNotBeReadyForSubmissionWhenStatusIsSubmitted() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);
        app.setStatus(ApplicationStatus.SUBMITTED);

        assertFalse(app.isReadyForSubmission());
    }

    // =========================================================================
    // PreUpdate Hook Tests
    // =========================================================================

    @Test
    @DisplayName("Should update updatedAt on preUpdate")
    void shouldUpdateUpdatedAtOnPreUpdate() throws InterruptedException {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);
        Instant originalUpdatedAt = app.getUpdatedAt();

        Thread.sleep(10); // Ensure time difference
        app.preUpdate();

        assertTrue(app.getUpdatedAt().isAfter(originalUpdatedAt));
    }

    // =========================================================================
    // Getter and Setter Tests
    // =========================================================================

    @Test
    @DisplayName("Should set and get all properties")
    void shouldSetAndGetAllProperties() {
        Application app = new Application();
        UUID id = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();
        Instant now = Instant.now();

        app.setId(id);
        app.setUserId(userId);
        app.setJobId(jobId);
        app.setCompany("Microsoft");
        app.setRole("Senior Developer");
        app.setLocation("Cape Town");
        app.setStatus(ApplicationStatus.PARTIAL_ACTION_REQUIRED);
        app.setAppliedAt(now);
        app.setNotes("Great opportunity");
        app.setSource("indeed");
        app.setApplicationUrl("https://microsoft.com/careers");
        app.setMatchScore(92);
        app.setCreatedAt(now);
        app.setUpdatedAt(now);
        app.setSubmittedAt(now);

        assertAll("All properties",
            () -> assertEquals(id, app.getId()),
            () -> assertEquals(userId, app.getUserId()),
            () -> assertEquals(jobId, app.getJobId()),
            () -> assertEquals("Microsoft", app.getCompany()),
            () -> assertEquals("Senior Developer", app.getRole()),
            () -> assertEquals("Cape Town", app.getLocation()),
            () -> assertEquals(ApplicationStatus.PARTIAL_ACTION_REQUIRED, app.getStatus()),
            () -> assertEquals(now, app.getAppliedAt()),
            () -> assertEquals("Great opportunity", app.getNotes()),
            () -> assertEquals("indeed", app.getSource()),
            () -> assertEquals("https://microsoft.com/careers", app.getApplicationUrl()),
            () -> assertEquals(92, app.getMatchScore()),
            () -> assertEquals(now, app.getCreatedAt()),
            () -> assertEquals(now, app.getUpdatedAt()),
            () -> assertEquals(now, app.getSubmittedAt())
        );
    }

    // =========================================================================
    // Edge Case Tests
    // =========================================================================

    @Test
    @DisplayName("Should handle null optional fields")
    void shouldHandleNullOptionalFields() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        app.setJobId(null);
        app.setLocation(null);
        app.setNotes(null);
        app.setSource(null);
        app.setApplicationUrl(null);
        app.setMatchScore(null);
        app.setSubmittedAt(null);

        assertAll("Null optional fields",
            () -> assertNull(app.getJobId()),
            () -> assertNull(app.getLocation()),
            () -> assertNull(app.getNotes()),
            () -> assertNull(app.getSource()),
            () -> assertNull(app.getApplicationUrl()),
            () -> assertNull(app.getMatchScore()),
            () -> assertNull(app.getSubmittedAt())
        );
    }

    @Test
    @DisplayName("Should handle very long notes")
    void shouldHandleVeryLongNotes() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);
        String longNotes = "A".repeat(10000);

        app.setNotes(longNotes);

        assertEquals(longNotes, app.getNotes());
    }

    @Test
    @DisplayName("Should handle special characters in company and role")
    void shouldHandleSpecialCharactersInCompanyAndRole() {
        Application app = new Application();

        app.setCompany("O'Reilly Media, Inc.");
        app.setRole("Senior C++ Developer (C#/.NET)");

        assertAll("Special characters",
            () -> assertEquals("O'Reilly Media, Inc.", app.getCompany()),
            () -> assertEquals("Senior C++ Developer (C#/.NET)", app.getRole())
        );
    }

    @Test
    @DisplayName("Should handle all status transitions")
    void shouldHandleAllStatusTransitions() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        for (ApplicationStatus status : ApplicationStatus.values()) {
            app.setStatus(status);
            assertEquals(status, app.getStatus());
        }
    }

    @Test
    @DisplayName("Should handle zero match score")
    void shouldHandleZeroMatchScore() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        app.setMatchScore(0);

        assertEquals(0, app.getMatchScore());
    }

    @Test
    @DisplayName("Should handle maximum match score")
    void shouldHandleMaximumMatchScore() {
        Application app = new Application(testUserId, TEST_COMPANY, TEST_ROLE);

        app.setMatchScore(100);

        assertEquals(100, app.getMatchScore());
    }
}
