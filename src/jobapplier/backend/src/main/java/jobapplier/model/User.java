package jobapplier.model;

import java.util.UUID;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

public class User {
    private final UUID id;
    private String name;
    private String surname;
    private String email;

    // Store only the encoded Argon2 hash string
    private String passwordHash;

    // Reasonable defaults for V1 (tune later):
    // iterations: 3, memory: 65536 KB (64MB), parallelism: 1
    private static final int ITERATIONS = 3;
    private static final int MEMORY_KB = 65536;
    private static final int PARALLELISM = 1;

    public User(UUID id, String name, String surname, String email, String rawPassword) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        if (email == null || email.isBlank()) throw new IllegalArgumentException("email cannot be blank");
        if (rawPassword == null || rawPassword.isBlank()) throw new IllegalArgumentException("password cannot be blank");

        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email.trim().toLowerCase();
        this.passwordHash = hashPassword(rawPassword);
    }

    // If you load users from DB where passwordHash already exists
        public static User fromHash(UUID id, String name, String surname, String email, String passwordHash) {
        User u = new User(id, name, surname, email, "temp-password-not-used");
        u.passwordHash = passwordHash;
        return u;
    }


    public boolean verifyPassword(String rawPassword) {
        if (rawPassword == null) return false;
        Argon2 argon2 = Argon2Factory.create();
        try {
            return argon2.verify(this.passwordHash, rawPassword.toCharArray());
        } finally {
            argon2.wipeArray(rawPassword.toCharArray());
        }
    }

    public void setPassword(String newRawPassword) {
        if (newRawPassword == null || newRawPassword.isBlank())
            throw new IllegalArgumentException("password cannot be blank");
        this.passwordHash = hashPassword(newRawPassword);
    }

    private static String hashPassword(String rawPassword) {
        Argon2 argon2 = Argon2Factory.create(); // defaults to Argon2id if available in library version
        char[] pwd = rawPassword.toCharArray();
        try {
            // The returned string includes parameters + salt, e.g. $argon2id$v=19$m=...
            return argon2.hash(ITERATIONS, MEMORY_KB, PARALLELISM, pwd);
        } finally {
            argon2.wipeArray(pwd); // wipe sensitive data
        }
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSurname() { return surname; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }

    public void setName(String name) { this.name = name; }
    public void setSurname(String surname) { this.surname = surname; }

    public void setEmail(String email) {
        if (email == null || email.isBlank()) throw new IllegalArgumentException("email cannot be blank");
        this.email = email.trim().toLowerCase();
    }
}
