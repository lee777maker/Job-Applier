package jobapplier.repository.jdbc;


import jobapplier.model.User;
import jobapplier.repository.UserRepository;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.util.UUID;

public class UserRepositoryJdbc implements UserRepository {
    private final DataSource ds;

    public UserRepositoryJdbc(DataSource ds) {
        this.ds = ds;
    }

    @Override
    public User findByEmail(String email) {
        String sql = "SELECT id,name,surname,email,password_hash FROM users WHERE email = ?";
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                UUID id = UUID.fromString(rs.getString("id"));
                String name = rs.getString("name");
                String surname = rs.getString("surname");
                String em = rs.getString("email");
                String hash = rs.getString("password_hash");

                // IMPORTANT: your User class needs a constructor/factory that accepts an existing hash
                // If you don't have it yet, I’ll show you how below.
                return User.fromHash(id, name, surname, em, hash);
            }
        } catch (Exception e) {
            throw new RuntimeException("findByEmail failed", e);
        }
    }

    @Override
    public void save(User user) {
        String sql = """
            INSERT INTO users(id,name,surname,email,password_hash,created_at)
            VALUES(?,?,?,?,?,?)
        """;
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {

            ps.setString(1, user.getId().toString());
            ps.setString(2, user.getName());
            ps.setString(3, user.getSurname());
            ps.setString(4, user.getEmail());
            ps.setString(5, user.getPasswordHash());
            ps.setString(6, Instant.now().toString());

            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("save user failed", e);
        }
    }
}
