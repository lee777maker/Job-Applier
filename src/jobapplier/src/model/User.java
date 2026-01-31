
package jobapplier.src.model;

import java.util.UUID;
import org.mindrot.jbcrypt.BCrypt;

public class User {
    private final UUID id;
    private String name;
    private String surname;
    private String email;
    private String passwordHash;

    public User(UUID id, String name, String surname, String email, String rawPassword) {
        if (id == null) throw new IllegalArgumentException("id cannot be null");
        if (email == null || email.isBlank()) throw new IllegalArgumentException("email cannot be blank");
        if (rawPassword == null || rawPassword.isBlank()) throw new IllegalArgumentException("password cannot be blank");

        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email.trim().toLowerCase();
        this.passwordHash = BCrypt.hashpw(rawPassword, BCrypt.gensalt());
    }

    // For loading from DB (already-hashed password)
    public static User fromHash(UUID id, String name, String surname, String email, String passwordHash) {
        User u = new User(id, name, surname, email, "temp_password_not_used");
        u.passwordHash = passwordHash;
        return u;
    }

    public boolean verifyPassword(String rawPassword) {
        if (rawPassword == null) return false;
        return BCrypt.checkpw(rawPassword, this.passwordHash);
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

    public void setPassword(String newRawPassword) {
        if (newRawPassword == null || newRawPassword.isBlank())
            throw new IllegalArgumentException("password cannot be blank");
        this.passwordHash = BCrypt.hashpw(newRawPassword, BCrypt.gensalt());
    }
}

