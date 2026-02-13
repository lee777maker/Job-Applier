CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    surname VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    job_description TEXT NOT NULL,
    job_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_job  FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
);

CREATE TABLE resumes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resume_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    application_id UUID NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_tasks_application_id ON tasks(application_id);
CREATE UNIQUE INDEX idx_resume_user ON resumes(user_id);
CREATE INDEX idx_app_user_id ON applications(user_id);
CREATE INDEX idx_app_job_id ON applications(job_id);
CREATE INDEX idx_users_email ON users(email);

-- Schema updates for user profile and resume management
ALTER TABLE users ADD COLUMN profile_data TEXT;
ALTER TABLE users ADD COLUMN resume_file_name VARCHAR(255);
ALTER TABLE users ADD COLUMN resume_uploaded_at TIMESTAMP;