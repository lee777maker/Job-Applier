package jobapplier.api.rest;

import jobapplier.model.Application;
import jobapplier.repository.ApplicationRepository;
import jobapplier.workflow.ApplicationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ApplicationController.class)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationRepository applicationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID testUserId;
    private UUID testApplicationId;
    private Application testApplication;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testApplicationId = UUID.randomUUID();
        
        testApplication = new Application();
        testApplication.setId(testApplicationId);
        testApplication.setUserId(testUserId);
        testApplication.setCompany("Test Company");
        testApplication.setRole("Software Engineer");
        testApplication.setLocation("Johannesburg");
        testApplication.setStatus(ApplicationStatus.SUBMITTED);
        testApplication.setAppliedAt(Instant.now());
        testApplication.setNotes("Test notes");
        testApplication.setSource("manual");
        testApplication.setApplicationUrl("https://example.com/job");
        testApplication.setMatchScore(85);
    }

    @Test
    void createApplication_ShouldCreateAndReturnApplication() throws Exception {
        when(applicationRepository.save(any(Application.class))).thenReturn(testApplication);

        String requestBody = """
            {
                "userId": "%s",
                "company": "Test Company",
                "role": "Software Engineer",
                "location": "Johannesburg",
                "status": "submitted",
                "notes": "Test notes",
                "matchScore": 85
            }
            """.formatted(testUserId);

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.company").value("Test Company"))
                .andExpect(jsonPath("$.role").value("Software Engineer"))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.message").value("Application created successfully"));
    }

    @Test
    void getUserApplications_ShouldReturnUserApplications() throws Exception {
        when(applicationRepository.findByUserIdOrderByAppliedAtDesc(any(UUID.class)))
                .thenReturn(Arrays.asList(testApplication));

        mockMvc.perform(get("/api/applications/user/" + testUserId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray())
                .andExpect(jsonPath("$.applications.length()").value(1))
                .andExpect(jsonPath("$.applications[0].company").value("Test Company"))
                .andExpect(jsonPath("$.applications[0].jobTitle").value("Software Engineer"));
    }

    @Test
    void getApplication_ShouldReturnApplication() throws Exception {
        when(applicationRepository.findById(any(UUID.class))).thenReturn(Optional.of(testApplication));

        mockMvc.perform(get("/api/applications/" + testApplicationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testApplicationId.toString()))
                .andExpect(jsonPath("$.company").value("Test Company"))
                .andExpect(jsonPath("$.role").value("Software Engineer"));
    }

    @Test
    void getApplication_WithInvalidId_ShouldReturnNotFound() throws Exception {
        when(applicationRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/applications/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateApplication_ShouldUpdateAndReturnSuccess() throws Exception {
        when(applicationRepository.findById(any(UUID.class))).thenReturn(Optional.of(testApplication));
        when(applicationRepository.save(any(Application.class))).thenReturn(testApplication);

        String requestBody = """
            {
                "status": "partial_action_required",
                "notes": "Updated notes"
            }
            """;

        mockMvc.perform(put("/api/applications/" + testApplicationId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.message").value("Application updated successfully"));
    }

    @Test
    void deleteApplication_ShouldDeleteAndReturnSuccess() throws Exception {
        doNothing().when(applicationRepository).deleteById(any(UUID.class));

        mockMvc.perform(delete("/api/applications/" + testApplicationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Application deleted successfully"));
    }

    @Test
    void updateStatus_ShouldUpdateStatusAndReturnSuccess() throws Exception {
        when(applicationRepository.findById(any(UUID.class))).thenReturn(Optional.of(testApplication));
        when(applicationRepository.save(any(Application.class))).thenReturn(testApplication);

        String requestBody = """
            {
                "status": "partial_action_required"
            }
            """;

        mockMvc.perform(post("/api/applications/" + testApplicationId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.message").value("Status updated successfully"));
    }

    @Test
    void submitApplication_ShouldSubmitAndReturnSuccess() throws Exception {
        when(applicationRepository.findById(any(UUID.class))).thenReturn(Optional.of(testApplication));
        when(applicationRepository.save(any(Application.class))).thenReturn(testApplication);

        mockMvc.perform(post("/api/applications/" + testApplicationId + "/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.message").value("Application submitted successfully"));
    }

    @Test
    void generateCoverLetter_ShouldReturnTaskInfo() throws Exception {
        mockMvc.perform(post("/api/applications/" + testApplicationId + "/cover-letter"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value(testApplicationId.toString()))
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.taskId").exists());
    }

    @Test
    void generateResume_ShouldReturnTaskInfo() throws Exception {
        mockMvc.perform(post("/api/applications/" + testApplicationId + "/resume"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value(testApplicationId.toString()))
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.taskId").exists());
    }
}