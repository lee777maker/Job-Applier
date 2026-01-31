package jobapplier.src.model;

import org.junit.jupiter.api.Test;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class UserTest {

    @Test
    void passwordVerificationWorks() {
        User user = new User(UUID.randomUUID(), "A", "B", "a@b.com", "pass123");
        assertTrue(user.verifyPassword("pass123"));
        assertFalse(user.verifyPassword("wrong"));
    }
}

