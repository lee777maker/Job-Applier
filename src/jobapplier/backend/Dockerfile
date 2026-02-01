FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy Maven wrapper and pom
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/api/ai/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "target/jobapplier-backend-1.0.0.jar"]
