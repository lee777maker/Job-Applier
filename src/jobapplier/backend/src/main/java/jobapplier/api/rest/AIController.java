package jobapplier.api.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

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
            if(msg.contains("talior") || msg.contains("cv")|| msg.contains("resume")){
                return ResponseEntity.ok(Map.of(
                    "response", 
                    "Got it! Please paste the job description and confirm which resume to use.",
                    "timestamp", System.currentTimeMillis(),
                    "action",
                    "TAILOR_RESUME"));
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
            // Call AI service for match score
            String url = aiServiceUrl + "/agents/match-score";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<MatchScoreRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, entity, Map.class
            );
            
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            // Return mock data if AI service is unavailable
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

    @PostMapping("/upload-resume")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
    try {
        String url = aiServiceUrl + "/agents/upload-resume";

        var headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        var body = new org.springframework.util.LinkedMultiValueMap<String, Object>();
        body.add("file", new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
        @Override public String getFilename() { return file.getOriginalFilename(); }
        });

        var entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        return ResponseEntity.ok(response.getBody());
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
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
}
