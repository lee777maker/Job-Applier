# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage - Ubuntu Jammy (glibc compatible)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install glibc compatibility for ARM64
RUN apt-get update && apt-get install -y \
    libc6 \
    libstdc++6 \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

# Create non-root user
RUN useradd -m -s /bin/bash spring
USER spring:spring

ENV PORT=8080
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT} -jar app.jar"]