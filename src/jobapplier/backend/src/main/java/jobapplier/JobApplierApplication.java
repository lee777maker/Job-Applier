package jobapplier;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
@SpringBootApplication
@EntityScan("jobapplier")
public class JobApplierApplication {
    public static void main(String[] args) {
        SpringApplication.run(JobApplierApplication.class, args);
    }
}
