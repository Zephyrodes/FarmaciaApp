# Sistema de Gestión de Farmacia con FastAPI

Este proyecto es una API para gestionar una farmacia que permite administrar usuarios, productos, órdenes de compra, asignación de EPS (Entidad Promotora de Salud) y el registro de movimientos económicos y de stock. La API está construida con **FastAPI**, utiliza **SQLAlchemy** para la persistencia en una base de datos SQLite y **Pydantic** para la validación de datos.

## Características Principales

- **Gestión de Usuarios:**  
  - Registro, listado, actualización y eliminación de usuarios.
  - Los usuarios tienen roles (admin, almacenista, cliente).
  - Los clientes pueden tener asignada una EPS, que otorga descuentos.

- **Gestión de Productos:**  
  - Creación, listado, actualización y eliminación de productos.
  - Manejo de stock, con un endpoint para eliminar productos sin stock.

- **Gestión de Órdenes:**  
  - Creación de órdenes asociadas automáticamente al usuario autenticado.
  - Cálculo del total de la orden con descuento aplicado (si el cliente tiene EPS asignada).
  - Confirmación y cancelación de órdenes.

- **Registro de Movimientos Económicos y de Stock:**  
  - Al confirmar una orden, se registran:
    - Movimientos financieros, con el total (descontado) y descripción.
    - Movimientos de stock, indicando la disminución de cada producto.

## Requisitos

- **Python 3.8+**
- **FastAPI**
- **Uvicorn** (para correr el servidor)
- **SQLAlchemy**
- **Pydantic**
- **Passlib** (para el manejo de contraseñas)

Puedes instalar las dependencias necesarias utilizando `pip`:

```bash
pip install fastapi uvicorn sqlalchemy pydantic passlib[bcrypt]
```

## Endpoints Principales

### Autenticación y Gestión de Usuarios
- **POST /register**: Registrar un nuevo usuario (solo admin).
- **POST /token**: Generar token de autenticación.
- **GET /users/**: Listar todos los usuarios (solo admin).
- **GET /users/{id}**: Obtener detalles de un usuario (solo admin).
- **PUT /users/{id}** y **DELETE /users/{id}**: Actualización y eliminación de usuarios.

### Gestión de Productos
- **POST /products/**: Crear un nuevo producto (admin y almacenista).
- **GET /products/**: Listar todos los productos.
- **GET /products/{id}**: Obtener detalles de un producto.
- **PUT /products/{id}** y **DELETE /products/{id}**: Actualizar y eliminar productos.
- **DELETE /products/out-of-stock**: Eliminar productos sin stock.

### Gestión de Órdenes
- **POST /orders/**: Crear una nueva orden.  
  La orden se crea automáticamente utilizando el usuario autenticado y se calcula el total con descuento (si corresponde).
- **GET /orders/**: Listar órdenes. Los clientes solo verán sus órdenes.
- **GET /orders/{id}**: Obtener detalles de una orden.
- **PUT /orders/{id}**: Actualizar una orden (sin modificar el comprador).
- **DELETE /orders/{id}**: Cancelar una orden pendiente.
- **POST /orders/{id}/confirm**: Confirmar una orden y registrar los movimientos económicos y de stock.

### Gestión de EPS
- **POST /eps/**: Crear una nueva EPS (solo admin).
- **GET /eps/**: Listar todas las EPS.
- **POST /assign_eps/**: Asignar una EPS a un cliente.

### Registro de Movimientos
- **GET /financial_movements/**: Listar movimientos financieros (solo admin y almacenista).
- **GET /stock_movements/**: Listar movimientos de stock (solo admin y almacenista).

## Estructura del Proyecto

El código se organiza en las siguientes secciones:
- **Configuración de la Base de Datos:** Conexión y creación de tablas.
- **Modelos SQLAlchemy:** Definición de las tablas para usuarios, productos, órdenes, EPS y movimientos.
- **Utilidades y Funciones Auxiliares:** Funciones comunes para la gestión de la base de datos, autenticación y verificación.
- **Esquemas Pydantic:** Validación de datos para las peticiones.
- **Endpoints:** Rutas para gestionar autenticación, usuarios, productos, órdenes, EPS y movimientos.

## Cualidades

- **Seguridad:**  
  La autenticación se basa en OAuth2 con contraseña y token Bearer. Se han implementado verificadores de roles para restringir el acceso a ciertos endpoints.

- **Movimientos Económicos y de Stock:**  
  Al confirmar una orden, se registran tanto el movimiento financiero como los cambios de stock, permitiendo llevar un historial de las transacciones y el estado del inventario.

- **Descuentos por EPS:**  
  El descuento se aplica a toda la orden en base al descuento asociado a la EPS del cliente.
