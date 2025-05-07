
# 💊 FarmaciaApp

**FarmaciaApp** es una aplicación web integral para la gestión de farmacias, diseñada para facilitar el control de productos, usuarios, órdenes, entidades de salud (EPS), movimientos financieros y de inventario. Incorpora además funcionalidades avanzadas como integración con AWS, gestión de imágenes, pasarela de pagos y comparación de precios con otras farmacias mediante web scraping.

---

## 🚀 Tecnologías Principales

- **Backend**: FastAPI + SQLAlchemy + SQlite
- **Frontend**: React + Axios + React Router
- **Base de datos**: SQlite (con Docker)
- **DevOps**: Docker + Docker Compose
- **Servicios en la nube**: AWS S3, Lambda, API Gateway
- **Otros**: Pasarela de pagos, Web Scraping con Selenium

---

## ⚙️ Funcionalidades Destacadas

### 🧑‍⚕️ Gestión de Usuarios y Roles
- Registro y autenticación con OAuth2 (JWT).
- Roles: `admin`, `almacenista`, `cliente`.
- Panel de administración según permisos.

### 📦 Gestión de Productos
- Creación, edición, eliminación y visualización de productos.
- Imágenes asociadas almacenadas en **AWS S3**.
- Control automático de stock.

### 🛒 Órdenes y Carrito de Compras
- Flujo tipo e-commerce para usuarios autenticados.
- Agregar/eliminar productos del carrito.
- Generación y seguimiento de órdenes de compra.

### 🏥 EPS y Afiliaciones
- CRUD de Entidades Promotoras de Salud.
- Asociación de usuarios con EPS.

### 💵 Movimientos Financieros
- Registro de ingresos y egresos.
- Consultas por tipo, fecha, usuario o monto.

### 📤 Almacenamiento en AWS S3
- Subida y visualización de imágenes de productos.
- URLs públicas protegidas.

### 🔐 API Gateway + Lambda (AWS)
- Validación de productos duplicados vía función Lambda.
- Control de acceso por endpoint.

### 💳 Pasarela de Pagos
- Integración con pasarela como Stripe.
- Procesamiento de compras en línea.
- Confirmación de pagos y actualización de estado de la orden.

### 🕵️ Comparación de Precios (Scraping)
- Scraping de precios de medicamentos en farmacias externas.
- Comparación automática de precios al momento de crear una orden.

---

## 📁 Estructura del Proyecto

FarmaciaApp/
├── backend/
├── frontend/
├── imagenesProductos/
├── docker-compose.yml
└── README.md

---

## 🐳 Despliegue Rápido con Docker

1. Clona el repositorio:
   git clone https://github.com/Zephyrodes/FarmaciaApp.git
   cd FarmaciaApp

2. Inicia los servicios:
   docker-compose up --build

3. Accede a:
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

---

## 🌐 Configuración en AWS

- S3 para almacenamiento de imágenes.
- Lambda + API Gateway para validaciones.
- RDS opcional para base de datos gestionada.

---

## 📦 Ejemplo de Endpoint para Pago

POST /api/payments
Authorization: Bearer <token>
{
  "order_id": "12345",
  "amount": 48000,
  "payment_method": "credit_card"
}

---

## 🔎 Web Scraping

Comparación con:
- La Rebaja Virtual

---

## 🛡️ Seguridad y Control

- JWT y OAuth2
- HTTPS recomendado

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Usa issues o pull requests.

---

## 📄 Licencia

Licencia MIT. Ver archivo LICENSE.

---

## 🧠 Autor

Desarrollado por [@Zephyrodes](https://github.com/Zephyrodes)
