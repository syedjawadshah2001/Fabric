FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY data/ /data/
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["gunicorn","config.wsgi:application","--bind","0.0.0.0:8000","--workers","2","--access-logfile","-"]
