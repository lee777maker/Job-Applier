package jobapplier.model;

import java.util.UUID;
import jakarta.persistence.*;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;

@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id; 

    private String name;
    private String surname;

    @Column(nullable = false, unique = true)
    private String email;

    // Store only the encoded Argon2 hash string
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable=false)
    private boolean enabled=true;
    // optional: map back from User -> Resume
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Resume resume;

    @Column(name = "profile_data", columnDefinition = "TEXT")
    private String profileData; // Store JSON string


    protected User() {
        // JPA needs a no-args constructor
    }

    // main constructor (raw password)
    public User(UUID id, String name, String surname, String email, String rawPassword, Resume resume) {
        // if (id == null) throw new IllegalArgumentException("id cannot be null");
        // if (email == null || email.isBlank()) throw new IllegalArgumentException("email cannot be blank");
        // if (rawPassword == null || rawPassword.isBlank()) throw new IllegalArgumentException("password cannot be blank");

        this.id = require(id, "id");
        this.name = name;
        this.surname = surname;
        this.email = normalizeEmail(email);
        setPassword(rawPassword);
        setResume(resume);
    }

    public User(UUID id, String name, String surname, String email, String rawPassword, Resume resume, boolean enabled){
        this.id = require(id, "id");
        this.name = name;
        this.surname = surname;
        this.email = normalizeEmail(email);
        this.enabled =enabled;
        
        if(rawPassword != null && !rawPassword.isBlank()){
            setPassword(rawPassword);
        }else if(passwordHash!=null && !passwordHash.isBlank()){
            this.passwordHash=passwordHash;
        }else throw new IllegalArgumentException("Either rawPassword or passwordHash must be provided");
    }
    public static User fromHash(UUID id, String name, String surname, String email, String passwordHash) {
        return fromHash(id, name, surname, email, passwordHash, null, true);
    }

    public static User fromHash(UUID id, String name, String surname, String email, String passwordHash, Resume resume) {
        return fromHash(id, name, surname, email, passwordHash, resume, true);
    }
    // DB hydration constructor/factory (already hashed)
    public static User fromHash(UUID id, String name, String surname, String email, String passwordHash, Resume resume, boolean enabled) {
        User u = new User();
        u.id = require(id,"id");
        u.name = name;
        u.surname = surname;
        u.email = normalizeEmail(email);
        u.passwordHash = requireNonBlank(passwordHash,"passwordHash");
        u.enabled = enabled;   
        u.setResume(resume);
        return u;
    }
    public void setPassword(String rawPassword) {
        this.passwordHash = hashPassword(requireNonBlank(rawPassword, "password"));
    }

    public boolean verifyPassword(String rawPassword) {
        if (rawPassword == null) return false;
        Argon2 argon2 = Argon2Factory.create();
        return argon2.verify(this.passwordHash, rawPassword.toCharArray());
    }
    private static String hashPassword(String rawPassword) {
        Argon2 argon2 = Argon2Factory.create();
        return argon2.hash(3, 65536, 1, rawPassword.toCharArray());
    }
    // helpers
    public void setResume(Resume resume){
        this.resume = resume;
        if(resume != null){
            resume.setUser(this);
        }
    }
    //getters
    public UUID getId(){return id;}
    public String getName(){return name;}
    public String getSurname(){return surname;}
    public String getEmail(){return email;}
    public String getPasswordHash() {return passwordHash;}
    public boolean isEnabled(){return enabled;}
    public Resume getResume(){return resume;}


    public String getProfileData() { return profileData; }
    public void setProfileData(String profileData) { this.profileData = profileData; }

    private static <T> T require(T v, String field) {
        if (v == null) throw new IllegalArgumentException(field + " cannot be null");
        return v;
    }

    private static String requireNonBlank(String v, String field) {
        if (v == null || v.isBlank()) throw new IllegalArgumentException(field + " cannot be blank");
        return v;
    }

    private static String normalizeEmail(String email) {
        String e = requireNonBlank(email, "email").trim().toLowerCase();
        return e;
    }

}



