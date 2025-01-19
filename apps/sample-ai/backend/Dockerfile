# Base image
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

# Set ARGs and ENVs
ARG PORT=
ARG BUILD_ENV=
ENV PORT=${PORT}
ENV FLASK_ENV=${BUILD_ENV}

# Install necessary tools and dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive \
    && ln -sf /usr/share/zoneinfo/Europe/Istanbul /etc/localtime \
    && apt-get install -y wget bzip2 libglib2.0-0 libxext6 libsm6 libxrender1 libgl1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Miniconda
WORKDIR /tmp
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh \
    && bash miniconda.sh -b -p /opt/conda \
    && rm miniconda.sh \
    && /opt/conda/bin/conda clean --all --yes

# Add Conda to PATH
ENV PATH="/opt/conda/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy environment file and application code
COPY environment.yml .

# Create Conda environment
RUN conda env create -f environment.yml -y && conda clean -afy

COPY . .

# Expose the application port
EXPOSE ${PORT}

# Run the Flask app in the activated environment
CMD ["/bin/bash", "-c", "source /opt/conda/etc/profile.d/conda.sh && conda activate sample_ai_backend && flask run --host=0.0.0.0 --port=${PORT}"]
