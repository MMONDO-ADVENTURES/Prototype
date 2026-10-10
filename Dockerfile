FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim

ARG BASE_URL=http://localhost:8000
ENV BASE_URL=$BASE_URL
ENV FRONTEND_URL=$BASE_URL

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

RUN pip install --no-cache-dir cryptography \
    && pip install --no-cache-dir -r requirements.txt

COPY backend/app/ app/
COPY frontend/static/ frontend/static/
COPY --from=frontend /frontend/dist frontend/dist

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
