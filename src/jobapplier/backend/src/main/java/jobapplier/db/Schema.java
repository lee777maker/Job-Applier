package jobapplier.db;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;


public class Schema {
    public static void init(DataSource ds){
        try(Connection c = ds.getConnection(); Statement s = c.createStatement()){
            //Users
            s.executeUpdate("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    surname TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                    """);
            //Jobs
            s.executeUpdate("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    company_name TEXT NOT NULL,
                    position TEXT NOT NULL,
                    description TEXT,
                    url TEXT,
                    created_at TEXT NOT NULL,
            );
                
                            """);
            //Applications
            s.executeUpdate("""
                CREATE TABLE IF NOT EXISTS applications (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    job_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (job_id) REFERENCES jobs(id)
                );
                            """);
                //Tasks
            s.executeUpdate("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    application_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    payload TEXT,
                    error TEXT,
                    FOREIGN KEY (application_id) REFERENCES applications(id)
                );
                            """);
            //Indexes
            s.executeUpdate("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);");
            s.executeUpdate("CREATE INDEX IF NOT EXISTS idx_task_app ON tasks(application_id");



        } catch (Exception e){
            throw new RuntimeException("Schema initialization failed", e);
        }
    }
    
}
