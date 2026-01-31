package jobapplier.db;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;

public class DatabaseManager {
    private final HikariDataSource dataSource;

    public DatabaseManager(String jdbcUrl){
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(jdbcUrl);
        cfg.setMaximumPoolSize(5);
        cfg.setPoolName("JobApplierPool");
        this.dataSource = new HikariDataSource(cfg);
    }
    
    public DataSource getDataSource() {
        return dataSource;
    }

    public void close() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }
}
