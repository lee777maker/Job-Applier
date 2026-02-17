package jobapplier.api.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class AIController {

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AIController() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {
        try {
            String msg = request.message() == null ? "" : request.message();
            if(msg.contains("tailor") || msg.contains("cv") || msg.contains("resume")){
                return ResponseEntity.ok(Map.of(
                    "response", 
                    "Got it! Please paste the job description and confirm which resume to use.",
                    "timestamp", System.currentTimeMillis(),
                    "action", "TAILOR_RESUME"
                ));
            }
            return ResponseEntity.ok(Map.of(
                "response", 
                "I can help with ATS scoring, CV tailoring, and cover letters. Tell me what you want to do.",
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "AI service error: " + e.getMessage()));
        }
    }

    @PostMapping("/match-score")
    public ResponseEntity<?> getMatchScore(@RequestBody MatchScoreRequest request) {
        try {
            String url = aiServiceUrl + "/agents/match-score";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<MatchScoreRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, entity, Map.class
            );
            
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }
    }

    @PostMapping("/tailor-resume")
    public ResponseEntity<?> tailorResume(@RequestBody TailorResumeRequest request) {
        try {
            String url = aiServiceUrl + "/agents/tailor-resume";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<TailorResumeRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, entity, Map.class
            );
            
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(503)
                .body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }
    }

    @PostMapping("/generate-cover-letter")
    public ResponseEntity<?> generateCoverLetter(@RequestBody CoverLetterRequest request) {
        try {
            String url = aiServiceUrl + "/agents/generate-cover-letter";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<CoverLetterRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, entity, Map.class
            );
            
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(503)
                .body(Map.of("error", "AI service unavailable: " + e.getMessage()));
        }
    }

    /**
     * NEW ENDPOINT: Extract job titles from CV text
     */
    @PostMapping("/extract-job-titles")
    public ResponseEntity<?> extractJobTitles(@RequestBody ExtractJobTitlesRequest request) {
        try {
            System.out.println("=== EXTRACT JOB TITLES REQUEST ===");
            System.out.println("CV Text length: " + (request.cvText() != null ? request.cvText().length() : 0));
            
            String url = aiServiceUrl + "/agents/extract-job-titles";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<ExtractJobTitlesRequest> entity = new HttpEntity<>(request, headers);
            
            System.out.println("Calling AI service: " + url);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, entity, Map.class
            );
            
            System.out.println("AI service response: " + response.getBody());
            
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            System.err.println("Extract job titles failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(503)
                .body(Map.of(
                    "error", "AI service unavailable: " + e.getMessage(),
                    "job_titles", new String[]{} // Return empty array as fallback
                ));
        }
    }

    /**
     * Upload resume and extract CV data
     */
    @PostMapping("/upload-resume")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
        try {
            String url = aiServiceUrl + "/agents/extract-cv";

            byte[] fileBytes = file.getBytes();
            
            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            org.springframework.util.LinkedMultiValueMap<String, Object> body = 
                new org.springframework.util.LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> entity = 
                new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                url, 
                entity, 
                String.class
            );

            if (response.getBody() != null) {
                Map<String, Object> responseBody = objectMapper.readValue(
                    response.getBody(), 
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
                );
                return ResponseEntity.ok(responseBody);
            } else {
                return ResponseEntity.status(500).body(Map.of("error", "Empty response from AI service"));
            }
            
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to read file: " + e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Upload failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            String url = aiServiceUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return ResponseEntity.ok(Map.of(
                "backend", "healthy",
                "ai_service", response.getBody()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "backend", "healthy",
                "ai_service", "unreachable - " + e.getMessage()
            ));
        }
    }

    // Request Records
    public record ChatRequest(
        String message,
        Object[] attachments
    ) {}

    public record MatchScoreRequest(
        Map<String, Object> user_profile,
        String job_description,
        String resume_text
    ) {}

    public record TailorResumeRequest(
        String original_resume,
        String job_description,
        Map<String, Object> user_profile,
        String style,
        String tone,
        String length
    ) {}

    public record CoverLetterRequest(
        Map<String, Object> user_profile,
        String job_description,
        String company_name,
        String hiring_manager
    ) {}

    public record ExtractJobTitlesRequest(
        String cvText,
        String userContext
    ) {}
}