# Sistema de Gestión de Farmacia

Este proyecto es una aplicación completa para la gestión integral de una farmacia. Está compuesta por:

- **Backend:** API RESTful desarrollada en **FastAPI** que permite la administración de usuarios, productos, órdenes, EPS, y el registro de movimientos económicos y de stock.
- **Frontend:** Interfaz de usuario (desarrollada en React) para interactuar con la API.
- **Contenedores Docker:** Configuración para desplegar fácilmente tanto el backend como el frontend utilizando Docker y Docker Compose.

## Características Principales

### Backend (FastAPI)
- **Gestión de Usuarios:**
  - Registro, listado, actualización y eliminación de usuarios.
  - Roles: *admin*, *almacenista* y *cliente*.
  - Autenticación con OAuth2 y token Bearer.

- **Gestión de Productos:**
  - Creación, listado, actualización y eliminación de productos.
  - Manejo de stock, incluyendo endpoint para eliminar productos sin stock.

- **Gestión de Órdenes:**
  - Creación de órdenes asociadas automáticamente al usuario autenticado.
  - Cálculo de totales con aplicación de descuentos según EPS asignada.
  - Confirmación y cancelación de órdenes.
  - Registro automático de movimientos financieros y de stock al confirmar una orden.

- **Gestión de EPS:**
  - Creación y listado de EPS (solo accesible para administradores).
  - Asignación de EPS a clientes para aplicar descuentos en las órdenes.

- **Registro de Movimientos:**
  - Consultas de movimientos financieros y de stock (acceso restringido a admin y almacenista).

### Frontend (React)
- Interfaz moderna para:
  - **Autenticación:** Inicio de sesión y registro.
  - **Gestión de Productos:** Visualización, creación y edición de productos.
  - **Gestión de Órdenes:** Realización y seguimiento de órdenes.
  - **Administración:** Módulos para gestión de usuarios, EPS, y consulta de movimientos.
- Comunicación directa con la API RESTful del backend.

### Despliegue con Docker
- **Dockerfile:** Configuraciones separadas para backend y frontend.
- **Docker Compose:** Orquestación de contenedores para facilitar el despliegue completo del sistema.

## Estructura del Proyecto

```plaintext
Farmacia/
├── backend/               # API en FastAPI
│   ├── farmacia.py        # Archivo principal de la API
│   ├── requirements.txt   # Dependencias del backend
│   ├── Dockerfile         # Dockerfile para el backend
│   ├── ADB.db             # Base de datos SQLite (archivo de ejemplo)
│   └── ...                # Otros módulos y archivos (modelos, rutas, etc.)
├── frontend/              # Aplicación en React
│   ├── src/               # Código fuente del frontend
│   │   ├── components/    # Componentes React (Login, Register, Products, etc.)
│   │   ├── services/      # Configuración para consumir la API
│   │   ├── App.js         # Componente principal de la aplicación
│   │   └── ...            # Otros archivos y assets (CSS, imágenes, etc.)
│   ├── public/            # Archivos públicos (index.html, logos, manifest, etc.)
│   ├── Dockerfile         # Dockerfile para el frontend
│   ├── package.json       # Dependencias y scripts de npm
│   └── package-lock.json
└── docker-compose.yml     # Orquestación de contenedores para backend y frontend
```

## Requisitos

- **Docker** y **Docker Compose** instalados en tu sistema.
- Alternativamente, para desarrollo local:
  - **Python 3.8+**
  - **Node.js** y **npm** (para el frontend)
  - Dependencias de Python listadas en `backend/requirements.txt`

## Instalación y Ejecución

### Usando Docker

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/tu-usuario/farmacia.git
   cd farmacia
   ```

2. **Construye y levanta los contenedores con Docker Compose:**

   ```bash
   docker-compose up --build
   ```

   Esto iniciará:
   - El **backend** en FastAPI, disponible en `http://localhost:8000` (documentación en `/docs`).
   - El **frontend** en React, accesible en `http://localhost:3000`.

### Ejecución en Desarrollo

#### Backend

1. Accede al directorio `backend`:

   ```bash
   cd Farmacia/backend
   ```

2. Crea un entorno virtual e instala las dependencias:

   ```bash
   python -m venv env
   source env/bin/activate  # En Windows: env\Scripts\activate
   pip install -r requirements.txt
   ```

3. Ejecuta el servidor:

   ```bash
   uvicorn farmacia:app --reload
   ```

   La API estará en `http://localhost:8000`.

#### Frontend

1. Accede al directorio `frontend`:

   ```bash
   cd Farmacia/frontend
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Inicia la aplicación:

   ```bash
   npm start
   ```

   La aplicación se abrirá en `http://localhost:3000`.

## Uso de la API

Consulta la documentación interactiva generada por FastAPI en `http://localhost:8000/docs` para probar y explorar todos los endpoints disponibles.


## Contribuciones

Las contribuciones son bienvenidas. Para colaborar:
- Realiza un fork del repositorio.
- Crea una rama para tu feature o fix.
- Envía un pull request describiendo los cambios.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
