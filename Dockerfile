# Imagen base de Python ligera
FROM python:3.9-slim

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo de dependencias e instala las librerías
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto 8000 (FastAPI lo usa por defecto)
EXPOSE 8000

# Comando para iniciar la aplicación: (archivo principal: farmacia.py, instancia: app)
CMD ["uvicorn", "farmacia:app", "--host", "0.0.0.0", "--port", "8000"]
