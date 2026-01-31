package jobapplier.repository;

import jobapplier.model.User;

public interface UserRepository {
    User findByEmail(String email);
    void save(User user);
}

