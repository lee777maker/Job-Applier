package jobapplier.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the User entity.
 * Tests cover user creation, password hashing, validation, and all public methods.
 */
class UserTest {

    // =========================================================================
    // User Creation Tests
    // =========================================================================

    @Test
    @DisplayName("Should create user with valid data")
    void shouldCreateUserWithValidData() {
        UUID id = UUID.randomUUID();
        User user = new User(id, "John", "Doe", "john@example.com", "password123", null);

        assertAll("User properties",
            () -> assertEquals(id, user.getId()),
            () -> assertEquals("John", user.getName()),
            () -> assertEquals("Doe", user.getSurname()),
            () -> assertEquals("john@example.com", user.getEmail()),
            () -> assertNotNull(user.getPasswordHash()),
            () -> assertTrue(user.isEnabled()),
            () -> assertNull(user.getResume())
        );
    }

    @Test
    @DisplayName("Should create user with resume")
    void shouldCreateUserWithResume() {
        Resume resume = new Resume();
        User user = new User(UUID.randomUUID(), "Jane", "Smith", "jane@example.com", "password123", resume);

        assertNotNull(user.getResume());
        assertEquals(user, resume.getUser()); // Bidirectional relationship
    }

    @Test
    @DisplayName("Should create disabled user when specified")
    void shouldCreateDisabledUserWhenSpecified() {
        User user = new User(UUID.randomUUID(), "Test", "User", "test@example.com", "password123", null, false);

        assertFalse(user.isEnabled());
    }

    // =========================================================================
    // Email Validation Tests
    // =========================================================================

    @Test
    @DisplayName("Should normalize email to lowercase")
    void shouldNormalizeEmailToLowercase() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "JOHN@EXAMPLE.COM", "password123", null);

        assertEquals("john@example.com", user.getEmail());
    }

    @Test
    @DisplayName("Should trim whitespace from email")
    void shouldTrimWhitespaceFromEmail() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "  john@example.com  ", "password123", null);

        assertEquals("john@example.com", user.getEmail());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("Should reject null or empty email")
    void shouldRejectNullOrEmptyEmail(String email) {
        assertThrows(IllegalArgumentException.class, () -> {
            new User(UUID.randomUUID(), "John", "Doe", email, "password123", null);
        });
    }

    // =========================================================================
    // ID Validation Tests
    // =========================================================================

    @Test
    @DisplayName("Should reject null id")
    void shouldRejectNullId() {
        assertThrows(IllegalArgumentException.class, () -> {
            new User(null, "John", "Doe", "john@example.com", "password123", null);
        });
    }

    // =========================================================================
    // Password Tests
    // =========================================================================

    @Test
    @DisplayName("Should hash password with Argon2")
    void shouldHashPasswordWithArgon2() {
        String rawPassword = "mySecurePassword123";
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", rawPassword, null);

        String hash = user.getPasswordHash();

        assertAll("Password hash",
            () -> assertNotEquals(rawPassword, hash),
            () -> assertTrue(hash.startsWith("$argon2")),
            () -> assertTrue(hash.length() > 50)
        );
    }

    @Test
    @DisplayName("Should verify correct password")
    void shouldVerifyCorrectPassword() {
        String rawPassword = "correctPassword";
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", rawPassword, null);

        assertTrue(user.verifyPassword(rawPassword));
    }

    @Test
    @DisplayName("Should reject incorrect password")
    void shouldRejectIncorrectPassword() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "correctPassword", null);

        assertFalse(user.verifyPassword("wrongPassword"));
    }

    @Test
    @DisplayName("Should reject null password verification")
    void shouldRejectNullPasswordVerification() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "password123", null);

        assertFalse(user.verifyPassword(null));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("Should reject null or empty password")
    void shouldRejectNullOrEmptyPassword(String password) {
        assertThrows(IllegalArgumentException.class, () -> {
            new User(UUID.randomUUID(), "John", "Doe", "john@example.com", password, null);
        });
    }

    @Test
    @DisplayName("Should update password")
    void shouldUpdatePassword() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "oldPassword", null);
        String oldHash = user.getPasswordHash();

        user.setPassword("newPassword123");

        assertAll("Password update",
            () -> assertNotEquals(oldHash, user.getPasswordHash()),
            () -> assertTrue(user.verifyPassword("newPassword123")),
            () -> assertFalse(user.verifyPassword("oldPassword"))
        );
    }

    // =========================================================================
    // fromHash Factory Method Tests
    // =========================================================================

    @Test
    @DisplayName("Should create user from existing hash")
    void shouldCreateUserFromExistingHash() {
        UUID id = UUID.randomUUID();
        String existingHash = "$argon2id$v=19$m=65536,t=3,p=1$...";

        User user = User.fromHash(id, "John", "Doe", "john@example.com", existingHash);

        assertAll("User from hash",
            () -> assertEquals(id, user.getId()),
            () -> assertEquals(existingHash, user.getPasswordHash()),
            () -> assertTrue(user.isEnabled())
        );
    }

    @Test
    @DisplayName("Should create user from hash with resume")
    void shouldCreateUserFromHashWithResume() {
        Resume resume = new Resume();
        User user = User.fromHash(UUID.randomUUID(), "Jane", "Smith", "jane@example.com", "hash123", resume);

        assertEquals(resume, user.getResume());
    }

    @Test
    @DisplayName("Should create disabled user from hash when specified")
    void shouldCreateDisabledUserFromHashWhenSpecified() {
        User user = User.fromHash(UUID.randomUUID(), "Test", "User", "test@example.com", "hash123", null, false);

        assertFalse(user.isEnabled());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("Should reject null or empty hash")
    void shouldRejectNullOrEmptyHash(String hash) {
        assertThrows(IllegalArgumentException.class, () -> {
            User.fromHash(UUID.randomUUID(), "John", "Doe", "john@example.com", hash);
        });
    }

    // =========================================================================
    // Profile Data Tests
    // =========================================================================

    @Test
    @DisplayName("Should set and get profile data")
    void shouldSetAndGetProfileData() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "password123", null);
        String profileJson = "{\"skills\": [\"Python\", \"Java\"]}";

        user.setProfileData(profileJson);

        assertEquals(profileJson, user.getProfileData());
    }

    @Test
    @DisplayName("Should allow null profile data")
    void shouldAllowNullProfileData() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "password123", null);

        user.setProfileData(null);

        assertNull(user.getProfileData());
    }

    // =========================================================================
    // Resume Relationship Tests
    // =========================================================================

    @Test
    @DisplayName("Should set resume with bidirectional relationship")
    void shouldSetResumeWithBidirectionalRelationship() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "password123", null);
        Resume resume = new Resume();

        user.setResume(resume);

        assertEquals(resume, user.getResume());
        assertEquals(user, resume.getUser());
    }

    @Test
    @DisplayName("Should allow null resume")
    void shouldAllowNullResume() {
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "password123", null);

        user.setResume(null);

        assertNull(user.getResume());
    }

    @Test
    @DisplayName("Should replace existing resume")
    void shouldReplaceExistingResume() {
        Resume oldResume = new Resume();
        User user = new User(UUID.randomUUID(), "John", "Doe", "john@example.com", "password123", oldResume);
        Resume newResume = new Resume();

        user.setResume(newResume);

        assertEquals(newResume, user.getResume());
        assertEquals(user, newResume.getUser());
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    @Test
    @DisplayName("Should handle special characters in name")
    void shouldHandleSpecialCharactersInName() {
        User user = new User(UUID.randomUUID(), "José", "O'Connor", "jose@example.com", "password123", null);

        assertEquals("José", user.getName());
        assertEquals("O'Connor", user.getSurname());
    }

    @Test
    @DisplayName("Should handle very long email")
    void shouldHandleVeryLongEmail() {
        String longEmail = "very.long.email.address." + "a".repeat(200) + "@example.com";
        User user = new User(UUID.randomUUID(), "John", "Doe", longEmail, "password123", null);

        assertEquals(longEmail.toLowerCase(), user.getEmail());
    }

    @ParameterizedTest
    @CsvSource({
        "'','',No name provided",
        "null,'',Null name handled"
    })
    @DisplayName("Should handle empty or null name")
    void shouldHandleEmptyOrNullName(String nameInput, String surnameInput, String description) {
        String name = "null".equals(nameInput) ? null : nameInput;
        String surname = "null".equals(surnameInput) ? null : surnameInput;

        User user = new User(UUID.randomUUID(), name, surname, "test@example.com", "password123", null);

        assertAll(description,
            () -> assertEquals(name, user.getName()),
            () -> assertEquals(surname, user.getSurname())
        );
    }
}
