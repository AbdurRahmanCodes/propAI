FROM node:20-bookworm AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=7860
WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY outputs/ ./outputs/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 7860
CMD ["sh", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
