package jobapplier.api.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import jobapplier.api.Manager;
import jobapplier.model.User;
import jobapplier.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.mockito.Mockito;

/**
 * Unit tests for the AuthController.
 * Tests cover registration, login, and authentication edge cases.
 */
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private Manager manager;

    @MockBean
    private UserRepository userRepository;

    // =========================================================================
    // Registration Tests
    // =========================================================================

    @Test
    @DisplayName("Should register new user successfully")
    void shouldRegisterNewUserSuccessfully() throws Exception {
        // Given
        when(userRepository.findByEmail(anyString())).thenReturn(null);
        Mockito.doAnswer(invocation -> null).when(manager).saveProfile(any(User.class));

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("john@example.com"))
            .andExpect(jsonPath("$.message").value("User registered successfully"));

        verify(userRepository).findByEmail("john@example.com");
        verify(manager).saveProfile(any(User.class));
    }

    @Test
    @DisplayName("Should reject registration with duplicate email")
    void shouldRejectRegistrationWithDuplicateEmail() throws Exception {
        // Given
        User existingUser = new User(UUID.randomUUID(), "Existing", "User", "existing@example.com", "password", null);
        when(userRepository.findByEmail("existing@example.com")).thenReturn(existingUser);

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "existing@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Email already in use"));

        verify(userRepository).findByEmail("existing@example.com");
        verify(manager, never()).saveProfile(any());
    }

    @Test
    @DisplayName("Should reject registration with missing name")
    void shouldRejectRegistrationWithMissingName() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "surname": "Doe",
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject registration with missing surname")
    void shouldRejectRegistrationWithMissingSurname() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject registration with invalid email")
    void shouldRejectRegistrationWithInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "invalid-email",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject registration with missing email")
    void shouldRejectRegistrationWithMissingEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject registration with missing password")
    void shouldRejectRegistrationWithMissingPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "john@example.com"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle registration save failure")
    void shouldHandleRegistrationSaveFailure() throws Exception {
        // Given
        when(userRepository.findByEmail(anyString())).thenReturn(null);
        Mockito.doThrow(new RuntimeException("Database error")).when(manager).saveProfile(any(User.class));

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.error").value("Registration failed: Database error"));
    }

    // =========================================================================
    // Login Tests
    // =========================================================================

    @Test
    @DisplayName("Should login with valid credentials")
    void shouldLoginWithValidCredentials() throws Exception {
        // Given
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "password123", null);
        when(manager.authenticate("john@example.com", "password123")).thenReturn(user);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "john@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("john@example.com"))
            .andExpect(jsonPath("$.name").value("John"))
            .andExpect(jsonPath("$.surname").value("Doe"));

        verify(manager).authenticate("john@example.com", "password123");
    }

    @Test
    @DisplayName("Should reject login with invalid credentials")
    void shouldRejectLoginWithInvalidCredentials() throws Exception {
        // Given
        when(manager.authenticate("john@example.com", "wrongpassword")).thenReturn(null);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "john@example.com",
                        "password": "wrongpassword"
                    }
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    @Test
    @DisplayName("Should reject login with missing email")
    void shouldRejectLoginWithMissingEmail() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject login with invalid email format")
    void shouldRejectLoginWithInvalidEmailFormat() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "not-an-email",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject login with missing password")
    void shouldRejectLoginWithMissingPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "john@example.com"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle login with non-existent user")
    void shouldHandleLoginWithNonExistentUser() throws Exception {
        // Given
        when(manager.authenticate("nonexistent@example.com", "password123")).thenReturn(null);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "nonexistent@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    // =========================================================================
    // Edge Case Tests
    // =========================================================================

    @Test
    @DisplayName("Should handle empty request body")
    void shouldHandleEmptyRequestBody() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle malformed JSON")
    void shouldHandleMalformedJson() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle special characters in name")
    void shouldHandleSpecialCharactersInName() throws Exception {
        // Given
        when(userRepository.findByEmail(anyString())).thenReturn(null);
        Mockito.doAnswer(invocation -> null).when(manager).saveProfile(any(User.class));

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "José María",
                        "surname": "García López",
                        "email": "jose@example.com",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("José María"));
    }

    @Test
    @DisplayName("Should normalize email to lowercase")
    void shouldNormalizeEmailToLowercase() throws Exception {
        // Given
        when(userRepository.findByEmail("MIXED@EXAMPLE.COM")).thenReturn(null);
        Mockito.doAnswer(invocation -> null).when(manager).saveProfile(any(User.class));

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "MIXED@EXAMPLE.COM",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("mixed@example.com"));
    }

    @Test
    @DisplayName("Should trim whitespace from email")
    void shouldTrimWhitespaceFromEmail() throws Exception {
        // Given
        when(userRepository.findByEmail("trimmed@example.com")).thenReturn(null);
        Mockito.doAnswer(invocation -> null).when(manager).saveProfile(any(User.class));

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "John",
                        "surname": "Doe",
                        "email": "  trimmed@example.com  ",
                        "password": "password123"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("trimmed@example.com"));
    }
}
