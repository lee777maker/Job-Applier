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
                
                // Semi-protected - allow all API calls for development
                .requestMatchers(
                    "/api/ai/**",             // All AI endpoints
                    "/api/profile/**",        // Profile operations
                    "/api/jobs/**",           // All job endpoints
                    "/api/preferences/**",    // User preferences
                    "/api/chat/**",           // Chat with Neilwe
                    "/api/applications",      // ← ADDED: Create applications
                    "/api/applications/**",   // ← ADDED: All application endpoints
                    "/api/dashboard/**"       // ← ADDED: Dashboard analytics
                ).permitAll()  
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            );
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow all origins for development
        configuration.setAllowedOrigins(List.of("*"));
        
        // Allow all HTTP methods
        configuration.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // Allow all headers
        configuration.setAllowedHeaders(List.of("*"));
        
        // Don't allow credentials with wildcard origins
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}