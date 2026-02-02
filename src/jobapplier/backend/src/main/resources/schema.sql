CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255),
    name VARCHAR(255)
);

CREATE TABLE jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    company VARCHAR(255)
);

CREATE TABLE applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    job_id BIGINT,
    status VARCHAR(50)
);
