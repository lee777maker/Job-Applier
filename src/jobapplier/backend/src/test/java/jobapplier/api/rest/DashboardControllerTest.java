package jobapplier.api.rest;

import jobapplier.model.Application;
import jobapplier.repository.ApplicationRepository;
import jobapplier.repository.UserRepository;
import jobapplier.workflow.ApplicationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationRepository applicationRepository;

    @MockBean
    private UserRepository userRepository;

    private UUID testUserId;
    private List<Application> testApplications;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        
        // Create test applications using enum status
        Application app1 = new Application();
        app1.setId(UUID.randomUUID());
        app1.setUserId(testUserId);
        app1.setCompany("Test Company 1");
        app1.setRole("Software Engineer");
        app1.setStatus(ApplicationStatus.SUBMITTED);
        app1.setAppliedAt(Instant.now());
        app1.setMatchScore(85);

        Application app2 = new Application();
        app2.setId(UUID.randomUUID());
        app2.setUserId(testUserId);
        app2.setCompany("Test Company 2");
        app2.setRole("DevOps Engineer");
        app2.setStatus(ApplicationStatus.PARTIAL_ACTION_REQUIRED);
        app2.setAppliedAt(Instant.now().minusSeconds(86400));
        app2.setMatchScore(90);

        Application app3 = new Application();
        app3.setId(UUID.randomUUID());
        app3.setUserId(testUserId);
        app3.setCompany("Test Company 3");
        app3.setRole("Data Scientist");
        app3.setStatus(ApplicationStatus.READY);
        app3.setAppliedAt(Instant.now().minusSeconds(172800));
        app3.setMatchScore(78);

        testApplications = Arrays.asList(app1, app2, app3);
    }

    @Test
    void getDashboardAnalytics_ShouldReturnCorrectAnalytics() throws Exception {
        when(applicationRepository.findByUserId(any(UUID.class))).thenReturn(testApplications);

        mockMvc.perform(get("/api/dashboard/analytics/" + testUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").value(3))
                .andExpect(jsonPath("$.interviewsScheduled").value(1))
                .andExpect(jsonPath("$.offersReceived").value(1))
                .andExpect(jsonPath("$.responseRate").value(100))
                .andExpect(jsonPath("$.averageMatchScore").value(84));
    }

    @Test
    void getUserApplications_ShouldReturnApplicationsList() throws Exception {
        when(applicationRepository.findByUserIdOrderByAppliedAtDesc(any(UUID.class)))
                .thenReturn(testApplications);

        mockMvc.perform(get("/api/dashboard/applications/" + testUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray())
                .andExpect(jsonPath("$.applications.length()").value(3))
                .andExpect(jsonPath("$.applications[0].company").value("Test Company 1"))
                .andExpect(jsonPath("$.applications[0].jobTitle").value("Software Engineer"))
                .andExpect(jsonPath("$.applications[0].status").value("submitted"));
    }

    @Test
    void getApplicationStatusBreakdown_ShouldReturnStatusCounts() throws Exception {
        when(applicationRepository.findByUserId(any(UUID.class))).thenReturn(testApplications);

        mockMvc.perform(get("/api/dashboard/status-breakdown/" + testUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.breakdown").isArray());
    }

    @Test
    void getWeeklyActivity_ShouldReturnWeeklyData() throws Exception {
        when(applicationRepository.findByUserIdAndAppliedAtAfter(any(UUID.class), any(Instant.class)))
                .thenReturn(testApplications);

        mockMvc.perform(get("/api/dashboard/weekly-activity/" + testUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weeklyData").isArray())
                .andExpect(jsonPath("$.weeklyData.length()").value(7));
    }

    @Test
    void getMatchScoreTrend_ShouldReturnTrendData() throws Exception {
        when(applicationRepository.findByUserIdOrderByAppliedAtAsc(any(UUID.class)))
                .thenReturn(testApplications);

        mockMvc.perform(get("/api/dashboard/match-score-trend/" + testUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trendData").isArray())
                .andExpect(jsonPath("$.trendData.length()").value(6));
    }

    @Test
    void getDashboardAnalytics_WithInvalidUserId_ShouldReturnError() throws Exception {
        mockMvc.perform(get("/api/dashboard/analytics/invalid-uuid"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void getDashboardAnalytics_WithNoApplications_ShouldReturnZeroAnalytics() throws Exception {
        when(applicationRepository.findByUserId(any(UUID.class))).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/dashboard/analytics/" + testUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").value(0))
                .andExpect(jsonPath("$.activeApplications").value(0))
                .andExpect(jsonPath("$.responseRate").value(0))
                .andExpect(jsonPath("$.averageMatchScore").value(0));
    }
}