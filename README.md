
# 💊 FarmaciaApp

**FarmaciaApp** es una aplicación web integral para la gestión de farmacias. Combina un backend desarrollado con FastAPI y un frontend interactivo hecho en React. Permite administrar usuarios, productos, órdenes, EPS, y controlar detalladamente movimientos económicos y de inventario.

## 🧩 Tecnologías Utilizadas

- **Backend:** FastAPI (Python)
- **Frontend:** React
- **Base de Datos:** SQLite
- **Contenedores:** Docker & Docker Compose

## ⚙️ Funcionalidades

### 🔐 Gestión de Usuarios
- Registro y autenticación de usuarios.
- Roles disponibles: `admin`, `almacenista`, `cliente`.
- Autenticación mediante OAuth2 con tokens Bearer.

### 📦 Gestión de Productos
- CRUD de productos.
- Gestión de stock.
- Visualización de imágenes asociadas a productos.

### 🏥 Gestión de EPS
- Administración de entidades promotoras de salud.
- Asociación de usuarios a EPS.

### 📄 Gestión de Órdenes
- Creación y seguimiento de órdenes.
- Registro de movimientos económicos y de inventario.

## 🚀 Instalación y Ejecución

### Requisitos Previos
- Docker
- Docker Compose

### Pasos

1. Clona el repositorio:

   ```bash
   git clone https://github.com/Zephyrodes/FarmaciaApp.git
   cd FarmaciaApp
   ```

2. Construye y levanta los contenedores:

   ```bash
   docker-compose up --build
   ```

3. Accede a la aplicación:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend (API docs): [http://localhost:8000/docs](http://localhost:8000/docs)

## 📁 Estructura del Proyecto

```
FarmaciaApp/
├── backend/                # Backend en FastAPI
│   ├── app/                # Código fuente del backend
│   ├── requirements.txt    # Dependencias del backend
│   └── ...
├── frontend/               # Aplicación React
│   ├── src/                # Componentes y vistas
│   └── ...
├── imagenesProductos/      # Imágenes de productos
├── docker-compose.yml      # Configuración de contenedores
└── README.md               # Documentación del proyecto
```

## 📬 Contacto

Para más información o soporte:

- **GitHub:** [Zephyrodes](https://github.com/Zephyrodes)
