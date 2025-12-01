# syntax=docker/dockerfile:1
ARG CUDA_VERSION=12.8.1-cudnn-runtime-ubuntu22.04
FROM nvidia/cuda:${CUDA_VERSION}

# Set environment variables for Python and uv optimization
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Application environment variables
ENV FLASK_ENV=
ENV COMMAND=
ENV PORT=
ENV ALLOWED_EXTENSIONS=
ENV MODELS_FOLDER=
ENV UPLOAD_FOLDER=
ENV OUTPUT_FOLDER=

# Set working directory
WORKDIR /app

# Install necessary tools, create user, and install uv
RUN apt-get update && apt-get install -y curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && adduser --disabled-password --gecos '' appuser \
    && chown appuser:appuser /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project files for dependency resolution
COPY --chown=appuser:appuser pyproject.toml uv.lock* ./

# Switch to appuser BEFORE uv sync
USER appuser

# Install Python and dependencies using uv as appuser
RUN uv python install 3.12 && \
    uv sync --frozen --no-dev --no-install-project

# Copy application code
COPY --chown=appuser:appuser . .

# Expose the application port
EXPOSE ${PORT}

# Run the Flask app
CMD ["/bin/bash", "-c", "if [ \"$COMMAND\" = \"check\" ]; then uv run --no-project python check.py; elif [ \"$COMMAND\" = \"app\" ]; then uv run --no-project python app.py; else echo 'Invalid COMMAND' && exit 1; fi"]
