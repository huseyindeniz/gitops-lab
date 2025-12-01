# syntax=docker/dockerfile:1
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout and stderr
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
RUN apt-get update && DEBIAN_FRONTEND=noninteractive \
    && ln -sf /usr/share/zoneinfo/Europe/Istanbul /etc/localtime \
    && apt-get install -y curl ca-certificates libglib2.0-0 libxext6 libsm6 libxrender1 libgl1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

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

# Expose the application port
EXPOSE ${PORT}

# Run the Flask app
CMD ["/bin/bash", "-c", " \
    source /app/.venv/bin/activate && \
    if [ \"$COMMAND\" = \"check\" ]; then \
    python check.py; \
    elif [ \"$COMMAND\" = \"app\" ]; then \
    flask run --host=0.0.0.0 --port=$PORT; \
    else \
    echo 'Invalid COMMAND specified: $COMMAND' && exit 1; \
    fi \
    "]
