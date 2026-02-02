FROM python:3.11-slim

WORKDIR /app

# System deps (optional but useful for many libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# adjust if your app uses another port
EXPOSE 8001

CMD ["python", "run.py"]
