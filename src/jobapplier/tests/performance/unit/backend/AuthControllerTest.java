package jobapplier.api.rest;

import jobapplier.api.Manager;
import jobapplier.model.User;
import jobapplier.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private Manager manager;

    @MockBean
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(
            UUID.randomUUID(),
            "Test",
            "User",
            "test@example.com",
            "password123",
            null,
            true
        );
    }

    @Test
    void login_WithValidCredentials_ReturnsUser() throws Exception {
        when(manager.authenticate("test@example.com", "password123"))
            .thenReturn(testUser);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"test@example.com\", \"password\": \"password123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.name").value("Test"))
            .andExpect(jsonPath("$.surname").value("User"));
    }

    @Test
    void login_WithInvalidCredentials_Returns401() throws Exception {
        when(manager.authenticate("test@example.com", "wrongpassword"))
            .thenReturn(null);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"test@example.com\", \"password\": \"wrongpassword\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Invalid credentials"));
    }

    @Test
    void register_WithNewEmail_ReturnsSuccess() throws Exception {
        when(userRepository.findByEmail("new@example.com")).thenReturn(null);
        when(manager.saveProfile(any(User.class))).thenReturn(testUser);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Test\", \"surname\": \"User\", \"email\": \"new@example.com\", \"password\": \"password123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User registered successfully"));
    }

    @Test
    void register_WithExistingEmail_Returns400() throws Exception {
        when(userRepository.findByEmail("existing@example.com")).thenReturn(testUser);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Test\", \"surname\": \"User\", \"email\": \"existing@example.com\", \"password\": \"password123\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Email already in use"));
    }

    @Test
    void login_WithMissingFields_Returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"\"}"))
            .andExpect(status().isBadRequest());
    }
}