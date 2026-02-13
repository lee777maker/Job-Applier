package jobapplier;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("jobapplier.model")
@EnableJpaRepositories("jobapplier.repository")
public class JobApplierApplication {
    public static void main(String[] args) {
        SpringApplication.run(JobApplierApplication.class, args);
    }
}