# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM python:3.11-slim AS builder

WORKDIR /app

# System deps (needed for some wheels / builds)
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps into /usr/local (so we can copy them cleanly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model (lands in site-packages)
RUN python -m spacy download en_core_web_sm


# ---------- Runtime stage ----------
# IMPORTANT: Keep the same distro family as the builder.
# Alpine (musl) will break many wheels (torch, spacy, etc.).
FROM python:3.11-slim

WORKDIR /app

# Copy installed deps + spaCy model from builder
COPY --from=builder /usr/local /usr/local

# App code
COPY . .


ENV PYTHONUNBUFFERED=1 \
    PORT=8001
EXPOSE 8001

# Cloud Run-friendly server (uses $PORT)
CMD ["sh", "-c", "gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:${PORT} app:app"]
