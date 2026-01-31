package jobapplier.src.model;

import java.util.UUID;

public class TestRunner {

    private static void assertTrue(boolean condition, String message) {
        if (!condition) throw new AssertionError("❌ " + message);
        System.out.println("✅ " + message);
    }

    public static void main(String[] args) {
        User u = new User(UUID.randomUUID(), "Lethabo", "Neo", "lethabo@example.com", "pass123");

        assertTrue(u.verifyPassword("pass123"), "Argon2 password verifies");
        assertTrue(!u.verifyPassword("wrong"), "Wrong password fails");
        assertTrue(u.getPasswordHash().startsWith("$argon2"), "Stored hash looks like Argon2");

        System.out.println("\n🎉 Argon2 test passed.");
    }
}

