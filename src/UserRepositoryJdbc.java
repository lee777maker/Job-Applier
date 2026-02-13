package jobapplier.repository;

import jobapplier.model.User;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class UserRepositoryJdbc implements UserRepository {
    
    private final Map<UUID, User> usersById = new ConcurrentHashMap<>();
    private final Map<String, User> usersByEmail = new ConcurrentHashMap<>();

    @Override
    public void save(User user) {
        usersById.put(user.getId(), user);
        usersByEmail.put(user.getEmail(), user);
    }

    @Override
    public User findById(UUID id) {
        return usersById.get(id);
    }

    @Override
    public User findByEmail(String email) {
        return usersByEmail.get(email.toLowerCase());
    }
}
