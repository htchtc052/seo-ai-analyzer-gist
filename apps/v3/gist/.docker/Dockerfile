FROM python:3.13-slim
RUN apt-get update && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY apps/v3/gist/pyproject.toml ./
RUN pip install --no-cache-dir .
COPY apps/v3/gist/main.py ./
USER nobody
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
