# SPDX-License-Identifier: MIT
# Production Dockerfile for Predictive Cooling Optimizer FastAPI Backend
FROM python:3.11-slim

WORKDIR /app

# Install system utilities if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, core, data, and models
COPY backend/ ./backend/
COPY core/ ./core/
COPY data/ ./data/
COPY models/ ./models/

# Default environment configuration
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    CORS_ORIGINS="http://localhost:5173"

EXPOSE 8000

# Health check using the standardized health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Execute backend using uvicorn
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
