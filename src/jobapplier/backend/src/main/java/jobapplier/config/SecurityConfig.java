package jobapplier.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - no authentication required
                .requestMatchers(
                    "/api/auth/**",           // Authentication endpoints
                    "/api/ai/health",         // Health checks
                    "/actuator/health",
                    "/actuator/info",
                    "/h2-console/**",
                    "/error"
                ).permitAll()
                
                // Semi-protected - allow with basic validation
                .requestMatchers(
                    "/api/ai/upload-resume",           // CV upload
                    "/api/ai/extract-job-titles",      // Job title extraction
                    "/api/profile/**",                 // Profile operations
                    "/api/jobs/recommendations/**",    // Job recommendations
                    "/api/jobs/search-by-profile",     // Profile-based search
                    "/api/jobs/search",                // General job search
                    "/api/preferences/**",             // User preferences
                    "/api/chat/**"                     // Chat with Neilwe
                ).permitAll()  // Changed to permitAll() - you can add JWT validation later
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin()) // For H2 console
            );
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow specific origins
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",  // Vite dev server
            "http://localhost:3000",  // React dev server alternative
            "http://localhost:8080",  // Backend
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080"
        ));
        
        // Allow all HTTP methods
        configuration.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // Allow all headers
        configuration.setAllowedHeaders(List.of("*"));
        
        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);
        
        // Expose headers to the frontend
        configuration.setExposedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-Total-Count"
        ));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}