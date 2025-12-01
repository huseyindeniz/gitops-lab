# syntax=docker/dockerfile:1
ARG CUDA_VERSION=12.8.1-cudnn-runtime-ubuntu22.04
FROM nvidia/cuda:${CUDA_VERSION}

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

# Application environment variables
ENV FLASK_ENV=
ENV COMMAND=
ENV PORT=
ENV ALLOWED_EXTENSIONS=
ENV MODELS_FOLDER=
ENV UPLOAD_FOLDER=
ENV OUTPUT_FOLDER=

# Install necessary tools and dependencies
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y curl ca-certificates

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Create a non-privileged user that the app will run under.
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/home/appuser" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .

# Install Python and dependencies using uv
RUN --mount=type=cache,target=/root/.cache/uv \
    uv python install 3.12 && \
    uv venv && \
    uv pip install -r requirements.txt

# Copy application code
COPY . .

# Change ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to the non-privileged user
USER appuser

# Expose the application port
EXPOSE ${PORT}

# Run the Flask app
CMD ["/bin/bash", "-c", " \
    source /app/.venv/bin/activate && \
    if [ \"$COMMAND\" = \"check\" ]; then \
    python check.py; \
    elif [ \"$COMMAND\" = \"app\" ]; then \
    python app.py; \
    else \
    echo 'Invalid COMMAND specified: $COMMAND' && exit 1; \
    fi \
    "]
