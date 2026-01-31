package jobapplier.repository;

import jobapplier.db.DatabaseManager;
import jobapplier.db.Schema;
import jobapplier.model.User;
import jobapplier.repository.jdbc.UserRepositoryJdbc;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class UserRepositoryJdbcTest {

    @Test
    void saveAndFindByEmail() {
        DatabaseManager db = new DatabaseManager("jdbc:sqlite::memory:");
        Schema.init(db.dataSource());

        UserRepositoryJdbc repo = new UserRepositoryJdbc(db.dataSource());

        User u = new User(UUID.randomUUID(), "Lethabo", "Neo", "lethabo@example.com", "pass123");
        repo.save(u);

        User loaded = repo.findByEmail("lethabo@example.com");
        assertNotNull(loaded);
        assertEquals(u.getEmail(), loaded.getEmail());
        assertTrue(loaded.verifyPassword("pass123"));

        db.close();
    }
}

