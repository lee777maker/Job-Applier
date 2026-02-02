package jobapplier.config;

import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for APIs + H2 console
            .csrf(csrf -> csrf
                .ignoringRequestMatchers(
                    "/h2-console/**",
                    "/api/**",
                    "/actuator/**"
                )
            )

            // Allow H2 console to render in browser
            .headers(headers -> headers
                .frameOptions(frame -> frame.disable())
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // --- PUBLIC / DIAGNOSTIC (DEV / DOCKER) ---
                .requestMatchers(
                    "/api/ai/health",
                    "/actuator/health",
                    "/actuator/info",
                    "/h2-console/**"
                ).permitAll()

                // --- EVERYTHING ELSE ---
                .anyRequest().authenticated()
            )

            // Simple HTTP Basic for now
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
