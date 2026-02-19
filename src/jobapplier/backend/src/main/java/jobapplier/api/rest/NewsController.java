package jobapplier.api.rest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class NewsController {

    // South African Career Resources - In production, this could come from a database or external API
    private static final List<Map<String, Object>> SA_CAREER_RESOURCES = Arrays.asList(
        Map.of(
            "id", "1",
            "title", "Top In-Demand Skills in South Africa 2024",
            "source", "Careers24",
            "excerpt", "Discover the most sought-after skills by SA employers across tech, finance, and healthcare sectors.",
            "url", "https://www.careers24.com/advice/career/in-demand-skills/",
            "category", "Career Advice",
            "date", "2024-01-15"
        ),
        Map.of(
            "id", "2",
            "title", "How to Negotiate Your Salary in South Africa",
            "source", "Indeed SA",
            "excerpt", "Expert tips on salary negotiation strategies specific to the South African job market.",
            "url", "https://www.indeed.com/career-advice/pay-salary/salary-negotiation-tips",
            "category", "Salary Guide",
            "date", "2024-01-12"
        ),
        Map.of(
            "id", "3",
            "title", "Remote Work Opportunities in South Africa",
            "source", "BizCommunity",
            "excerpt", "The rise of remote work and how SA professionals can access global opportunities.",
            "url", "https://www.bizcommunity.com/Article/196/182/234393.html",
            "category", "Remote Work",
            "date", "2024-01-10"
        ),
        Map.of(
            "id", "4",
            "title", "BEE Requirements in Job Applications",
            "source", "SA Labour Guide",
            "excerpt", "Understanding BEE certification and its impact on your job search in South Africa.",
            "url", "https://www.labourguide.co.za/bee",
            "category", "HR & Legal",
            "date", "2024-01-08"
        ),
        Map.of(
            "id", "5",
            "title", "CV Writing Tips for South African Employers",
            "source", "PNet",
            "excerpt", "How to format and structure your CV to meet SA employer expectations.",
            "url", "https://www.pnet.co.za/career-advice/cvs/cv-writing-tips",
            "category", "CV Tips",
            "date", "2024-01-05"
        ),
        Map.of(
            "id", "6",
            "title", "IT Industry Hiring Trends in Johannesburg & Cape Town",
            "source", "ITWeb",
            "excerpt", "Latest hiring trends and salary benchmarks for tech professionals in major SA cities.",
            "url", "https://www.itweb.co.za/",
            "category", "Industry News",
            "date", "2024-01-03"
        ),
        Map.of(
            "id", "7",
            "title", "Interview Preparation: Common Questions SA Employers Ask",
            "source", "CareerJunction",
            "excerpt", "Prepare for your next interview with these commonly asked questions in SA job interviews.",
            "url", "https://www.careerjunction.co.za/blog/",
            "category", "Interview Prep",
            "date", "2024-01-01"
        ),
        Map.of(
            "id", "8",
            "title", "Understanding Your Employment Contract in SA",
            "source", "LegalWise",
            "excerpt", "Key clauses to look out for in South African employment contracts.",
            "url", "https://www.legalwise.co.za/",
            "category", "Legal",
            "date", "2023-12-28"
        ),
        Map.of(
            "id", "9",
            "title", "LinkedIn Profile Optimization for SA Job Seekers",
            "source", "LinkedIn",
            "excerpt", "How to make your LinkedIn profile stand out to South African recruiters.",
            "url", "https://www.linkedin.com/business/talent/blog/product-tips/linkedin-profile-tips",
            "category", "Career Advice",
            "date", "2024-01-18"
        ),
        Map.of(
            "id", "10",
            "title", "Tech Skills Gap in South Africa: What Employers Want",
            "source", "Brainstorm",
            "excerpt", "Analysis of the current tech skills shortage and opportunities for upskilling.",
            "url", "https://www.itweb.co.za/",
            "category", "Industry News",
            "date", "2024-01-20"
        )
    );

    @GetMapping("/career-resources")
    public ResponseEntity<?> getCareerResources(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        
        List<Map<String, Object>> resources = new ArrayList<>(SA_CAREER_RESOURCES);
        
        // Filter by category if provided
        if (category != null && !category.isEmpty()) {
            resources = resources.stream()
                .filter(r -> r.get("category").toString().equalsIgnoreCase(category))
                .collect(java.util.stream.Collectors.toList());
        }
        
        // Sort by date (newest first)
        resources.sort((a, b) -> {
            LocalDate dateA = LocalDate.parse(a.get("date").toString());
            LocalDate dateB = LocalDate.parse(b.get("date").toString());
            return dateB.compareTo(dateA);
        });
        
        // Limit results
        if (resources.size() > limit) {
            resources = resources.subList(0, limit);
        }
        
        return ResponseEntity.ok(Map.of("resources", resources));
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        Set<String> categories = SA_CAREER_RESOURCES.stream()
            .map(r -> r.get("category").toString())
            .collect(java.util.stream.Collectors.toSet());
        
        return ResponseEntity.ok(Map.of("categories", new ArrayList<>(categories)));
    }

    @GetMapping("/resource/{id}")
    public ResponseEntity<?> getResourceById(@PathVariable String id) {
        Optional<Map<String, Object>> resource = SA_CAREER_RESOURCES.stream()
            .filter(r -> r.get("id").toString().equals(id))
            .findFirst();
        
        if (resource.isPresent()) {
            return ResponseEntity.ok(resource.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}