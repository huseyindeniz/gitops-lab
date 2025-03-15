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
    apt-get update && apt-get install -y wget bzip2

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/home/appuser" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# switch to the non-privileged user to run the application
USER appuser

# Install Miniconda
WORKDIR /home/appuser
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh \
    && bash miniconda.sh -b -p /home/appuser/miniconda \
    && rm miniconda.sh \
    && /home/appuser/miniconda/bin/conda clean --all --yes

# Add Conda to PATH
ENV PATH="/home/appuser/miniconda/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy environment file and application code
COPY environment.yml .

# Create Conda environment
RUN --mount=type=cache,target=/opt/conda/pkgs \
    conda env create -f environment.yml -y && conda clean -afy

COPY . .

# Expose the application port
EXPOSE ${PORT}

# Run the Flask app in the activated environment
CMD ["/bin/bash", "-c", " \
    source /home/appuser/miniconda/etc/profile.d/conda.sh && \
    conda activate sample_ai_inference_api && \
    if [ \"$COMMAND\" = \"check\" ]; then \
    python check.py; \
    elif [ \"$COMMAND\" = \"app\" ]; then \
    python app.py; \
    else \
    echo 'Invalid COMMAND specified: $COMMAND' && exit 1; \
    fi \
    "]