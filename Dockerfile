# Imagen del backend + frontend (todo servido por app.py, stdlib http.server)
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8765
EXPOSE 8765

CMD ["python", "app.py"]
