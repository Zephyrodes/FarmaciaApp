import os
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Request, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, constr, conint
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship, joinedload
import jwt
import boto3
from selenium import webdriver
from selenium.webdriver import Remote
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.common.by import By
import time
import urllib.parse
import stripe
import requests
import json
import re
from rapidfuzz import fuzz
from cryptography.fernet import Fernet, InvalidToken
from fastapi.responses import JSONResponse
import secrets
import logging

load_dotenv()

# -----------------------------
# Configuración de la base de datos (MySQL)
# -----------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no configurada en el entorno")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -----------------------------
# Seguridad: Hashing y cifrado (Fernet)
# -----------------------------
# Genera una nueva clave segura
key = Fernet.generate_key()
secret = secrets.token_urlsafe(32)
# Contexto bcrypt para hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
# Clave de cifrado Fernet
FERNET_KEY = key
if not FERNET_KEY:
    raise RuntimeError("FERNET_KEY no configurada")
cipher_suite = Fernet(FERNET_KEY)

# Funciones de hashing + cifrado de contraseñas

def get_password_hash(password: str) -> str:
    # 1) genera hash bcrypt
    bcrypt_hash = pwd_context.hash(password)
    # 2) cifra el hash con Fernet
    token = cipher_suite.encrypt(bcrypt_hash.encode())
    # 3) devuelve el token en base64 (str)
    return token.decode()

def verify_password(plain_password: str, token_hash: str) -> bool:
    try:
        # 1) descifra el token a bytes -> bcrypt_hash
        decrypted = cipher_suite.decrypt(token_hash.encode())
    except Exception:
        return False
    # 2) compara con bcrypt
    return pwd_context.verify(plain_password, decrypted.decode())

# -----------------------------
# Configuración JWT
# -----------------------------
SECRET_KEY = secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# -----------------------------
# Modelos SQLAlchemy
# -----------------------------
class RoleDB(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(200))
    disabled = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("RoleDB")

class ProductDB(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    stock = Column(Integer)
    price = Column(Integer)
    image_filename = Column(String(200), nullable=True)

class OrderDB(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(20), default="pending")
    total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    stripe_payment_intent_id = Column(String(100), nullable=True)
    payment_status = Column(String(20), default="unpaid")
    
    client = relationship("UserDB")
    items = relationship("OrderItemDB", back_populates="order")

class OrderItemDB(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    
    order = relationship("OrderDB", back_populates="items")
    product = relationship("ProductDB")

# Nuevos modelos para movimientos económicos
class FinancialMovementDB(Base):
    __tablename__ = "financial_movements"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float)
    description = Column(String(255))

class StockMovementDB(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    change = Column(Integer)  # negativo para disminución, positivo para aumento
    description = Column(String(255))

class ExternalPrice(Base):
    __tablename__ = "external_prices"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    price = Column(String(20), nullable=False)
    url = Column(String(2083), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

# -----------------------------
# Modelos Pydantic
# -----------------------------
class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class ProductCreate(BaseModel):
    name: str
    stock: int
    price: int
    image_filename: Optional[str] = None
# -----------------------------
# Utilidades y funciones auxiliares
# -----------------------------
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user(db: Session, username: str) -> UserDB:
    return db.query(UserDB).filter(UserDB.username == username).first()

def authenticate_user(db: Session, username: str, password: str) -> UserDB:
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def get_object_or_404(db: Session, model, obj_id: int):
    obj = db.query(model).filter(model.id == obj_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail=f"{model.__name__} no encontrado")
    return obj

# Función para crear JWT
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Actualización de get_current_user para usar JWT
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(db, username)
    if user is None:
        raise credentials_exception
    return user

def verify_role(required_roles: List[str]):
    def role_checker(current_user: UserDB = Depends(get_current_user)) -> UserDB:
        if current_user.role.name not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado, se requiere uno de los roles {required_roles}"
            )
        return current_user
    return role_checker

# -----------------------------
# Esquemas Pydantic
# -----------------------------
class User(BaseModel):
    id: int
    username: str
    disabled: bool = False
    role: str
    class Config:
        from_attributes = True 

class Product(BaseModel):
    name: str
    stock: int
    price: int
    image_filename: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    stock: int
    price: int
    image_filename: Optional[str] = None

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreateRequest(BaseModel):
    items: List[OrderItemCreate]

# Esquemas para movimientos (opcionalmente se pueden crear schemas de respuesta)
class FinancialMovement(BaseModel):
    id: int
    order_id: int
    timestamp: datetime
    amount: float
    description: str

    class Config:
        from_attributes = True

class StockMovement(BaseModel):
    id: int
    product_id: int
    timestamp: datetime
    change: int
    description: str

    class Config:
        from_attributes = True

# Esquema para respuesta de token JWT
class Token(BaseModel):
    access_token: str
    token_type: str

# Creacion de un pago
class CreatePayment(BaseModel):
    order_id: int

# -----------------------------
# Inicialización de datos (Roles y usuario admin)
# -----------------------------
def init_db():
    db = SessionLocal()
    # Crear roles predeterminados
    admin_role = db.query(RoleDB).filter_by(name="admin").first()
    if not admin_role:
        admin_role = RoleDB(name="admin")
        db.add(admin_role)
    almacenista_role = db.query(RoleDB).filter_by(name="almacenista").first()
    if not almacenista_role:
        almacenista_role = RoleDB(name="almacenista")
        db.add(almacenista_role)
    cliente_role = db.query(RoleDB).filter_by(name="cliente").first()
    if not cliente_role:
        cliente_role = RoleDB(name="cliente")
        db.add(cliente_role)
    db.commit()
    
    # Crear usuario admin si no existe
    admin_user = db.query(UserDB).filter_by(username="admin").first()
    if not admin_user:
        admin_user = UserDB(
            username="admin",
            hashed_password=get_password_hash("fasapisecrets"),
            role_id=admin_role.id
        )
        db.add(admin_user)
        db.commit()
    db.close()

init_db()

# -----------------------------
# Instancia de FastAPI
# -----------------------------
app = FastAPI()

# -----------------------------
# Cross-Origin Resource Sharing
# -----------------------------
origins = [
    "http://localhost:3000",  # Origen de tu frontend
    "http://172.18.0.5:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Permite estos orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Configuración para acceso a S3
s3 = boto3.client("s3", region_name="us-east-1")
BUCKET_NAME = os.getenv("BUCKET_NAME", "imagenes-productos-farmacia")

#Remote WebDriver Selenium
SELENIUM_HOST = os.getenv("SELENIUM_HOST", "localhost")
SELENIUM_PORT = os.getenv("SELENIUM_PORT", "4444")

#Puerto de Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# -----------------------------
# Configuración Lambda URLs
# -----------------------------
LAMBDA_URL_PRODUCTO = "https://fnoo5iqzzf.execute-api.us-east-1.amazonaws.com/prod/validate-product"
LAMBDA_URL_USERNAME = "https://fnoo5iqzzf.execute-api.us-east-1.amazonaws.com/prod/validate-username"

# -----------------------------
# Endpoints de Autenticación y Usuarios
# -----------------------------

MAX_PAYLOAD_SIZE = 1 * 1024 * 1024  # Límite de 1MB

@app.post("/register", dependencies=[Depends(verify_role(["admin"]))])
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario (solo admin)."""

    # 1) Validar formato del username con Lambda
    try:
        lambda_response = requests.post(
            LAMBDA_URL_USERNAME,  # URL para validar el username
            json={"username": user.username},  # Solo validación del username
            headers={"Content-Type": "application/json"}
        )

        if lambda_response.status_code != 200:
            body = lambda_response.json()
            error_msg = body.get("error", "Error desconocido en validación de username")
            raise HTTPException(status_code=lambda_response.status_code, detail=error_msg)
        
        # Usar username validado o el original si no viene
        validated_username = lambda_response.json().get("data", {}).get("username", user.username)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en validación de username vía Lambda: {str(e)}")

    # 2) Verificar si el username ya existe en la base de datos
    existing_user = db.query(UserDB).filter(UserDB.username == validated_username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    # 3) Verificar que el rol sea válido
    role = db.query(RoleDB).filter(RoleDB.name == user.role).first()
    if not role:
        raise HTTPException(status_code=400, detail="Rol inválido")

    # 4) Crear el nuevo usuario
    new_user = UserDB(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        role_id=role.id
    )
    db.add(new_user)
    db.commit()

    return {"message": "Usuario registrado exitosamente"}


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Generar token para autenticación."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de usuario o contraseña incorrectos"
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/", response_model=List[User])
async def list_users(db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin"]))):
    """Listar todos los usuarios (solo admin)."""
    users = db.query(UserDB).all()
    result = []
    for user in users:
        user_data = {
            "id": user.id,  # Agregado el campo id
            "username": user.username,
            "disabled": user.disabled,
            "role": user.role.name,
        }
        result.append(user_data)
    return result

@app.get("/users/{id}")
async def get_user_by_id(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin"]))):
    """Obtener detalles de un usuario por ID (solo admin)."""
    user = db.query(UserDB).filter(UserDB.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    data = {"username": user.username, "disabled": user.disabled, "role": user.role.name}
    return data

@app.put("/users/{id}")
async def update_user(id: int, user_data: UserCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin"]))):
    """Actualizar datos de un usuario (solo admin)."""
    user = db.query(UserDB).filter(UserDB.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.username = user_data.username
    user.hashed_password = get_password_hash(user_data.password)
    db.commit()
    return {"message": "Usuario actualizado exitosamente"}

@app.delete("/users/{id}")
async def delete_user(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin"]))):
    """Eliminar un usuario (solo admin)."""
    user = db.query(UserDB).filter(UserDB.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado exitosamente"}

# -----------------------------
# Endpoints de Productos
# -----------------------------

# Configura el logging en el backend
logging.basicConfig(level=logging.DEBUG)

@app.post("/products/", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def create_product(
    product: ProductCreate, 
    confirmado: Optional[bool] = Query(False),  # Confirmado como parámetro de consulta
    db: Session = Depends(get_db)
):
    """Crear un nuevo producto, permitiendo confirmación manual si hay ambigüedad en el nombre."""

    # 1) Validar tamaño del payload (1MB)
    raw_data = json.dumps(product.dict())
    if len(raw_data.encode('utf-8')) > 1 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Payload demasiado grande (máx. 1 MB)")

    # 2) Validación del producto vía Lambda (solo precio y stock)
    try:
        lambda_response = requests.post(
            LAMBDA_URL_PRODUCTO,  # URL de la función Lambda para validar producto
            json={
                "precio": product.price,
                "stock": product.stock
            }
        )
        if lambda_response.status_code == 400:
            errores = json.loads(lambda_response.json()["body"])["errores"]
            raise HTTPException(status_code=400, detail=errores)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en validación de producto: {str(e)}")

    # 3) Verificar similitudes con productos ya existentes usando RapidFuzz
    productos = db.query(ProductDB).all()
    for existente in productos:
        similitud = fuzz.ratio(product.name.lower(), existente.name.lower())
        logging.debug(f"Similitud con el producto '{existente.name}': {similitud}")

        if similitud >= 70:
            if not confirmado:
                logging.debug(f"Similitud alta detectada: {existente.name}, se necesita confirmación.")
                return JSONResponse(
                    status_code=status.HTTP_409_CONFLICT,
                    content={
                        "mensaje": "Este producto es similar a uno ya existente.",
                        "producto_similar": existente.name,
                        "confirmacion_requerida": True
                    }
                )
            break

    # 4) Sanitización para prevenir XSS
    def sanitize(val):
        return re.sub(r"[<>\"']", "", str(val))

    sanitized = {k: sanitize(v) if isinstance(v, str) else v for k, v in product.dict().items()}

    # 5) Guardar producto si todo es válido
    new_product = ProductDB(
        name=sanitized["name"],
        price=sanitized["price"],
        stock=sanitized["stock"],
        image_filename=sanitized.get("image_filename", None)
    )
    db.add(new_product)
    db.commit()

    logging.debug("Producto guardado exitosamente.")  # Debugging: Log de éxito
    return {"message": "Producto agregado exitosamente"}

@app.get("/products/")
async def list_products(db: Session = Depends(get_db)):
    """Listar todos los productos."""
    products = db.query(ProductDB).all()
    return products

@app.get("/products/{id}")
async def get_product(id: int, db: Session = Depends(get_db)):
    """Obtener detalles de un producto por ID."""
    product = db.query(ProductDB).filter(ProductDB.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@app.put("/products/{id}", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def update_product(id: int, product_data: Product, db: Session = Depends(get_db)):
    """Actualizar un producto existente."""
    product = db.query(ProductDB).filter(ProductDB.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.name = product_data.name
    product.stock = product_data.stock
    product.price = product_data.price
    product.image_filename = product_data.image_filename
    db.commit()
    return {"message": "Producto actualizado exitosamente"}

@app.delete("/products/{id}", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def delete_product(id: int, db: Session = Depends(get_db)):
    """Eliminar un producto."""
    product = db.query(ProductDB).filter(ProductDB.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(product)
    db.commit()
    return {"message": "Producto eliminado exitosamente"}

@app.delete("/products/out-of-stock", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def delete_out_of_stock_products(db: Session = Depends(get_db)):
    """Eliminar productos sin stock."""
    db.query(ProductDB).filter(ProductDB.stock == 0).delete()
    db.commit()
    return {"message": "Productos sin stock eliminados exitosamente"}

# -----------------------------
# Endpoints de Órdenes
# -----------------------------
def get_order(db: Session, order_id: int) -> OrderDB:
    return (
        db.query(OrderDB)
        .options(joinedload(OrderDB.items).joinedload(OrderItemDB.product))
        .filter(OrderDB.id == order_id)
        .first()
    )

@app.post("/orders/")
async def create_order(order: OrderCreateRequest, db: Session = Depends(get_db), 
                       current_user: UserDB = Depends(verify_role(["cliente", "admin"]))):
    """Crear una nueva orden vinculada al usuario autenticado."""
    if not order.items:
        raise HTTPException(status_code=400, detail="La orden debe contener al menos un producto")
    
    new_order = OrderDB(client_id=current_user.id, total=0)
    db.add(new_order)
    db.commit()

    total_price = 0
    for item in order.items:
        product = db.query(ProductDB).filter(ProductDB.id == item.product_id).first()
        if not product or product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para el producto {product.name}")
        total_price += product.price * item.quantity
        product.stock -= item.quantity  # Actualizar stock
        order_item = OrderItemDB(order_id=new_order.id, product_id=product.id, quantity=item.quantity)
        db.add(order_item)
    new_order.total = total_price
    db.commit()
    return {"message": "Pedido creado exitosamente", "order_id": new_order.id}

@app.get("/orders/")
async def list_orders(db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista", "cliente"]))):
    """Listar órdenes según rol del usuario."""
    if current_user.role.name == "cliente":
        return db.query(OrderDB).filter(OrderDB.client_id == current_user.id).all()
    return db.query(OrderDB).all()

@app.get("/orders/{id}")
async def get_order_details(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista", "cliente"]))):
    """Obtener detalles de una orden."""
    order = get_order(db, id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if current_user.role.name == "cliente" and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este pedido")
    return order

@app.put("/orders/{id}")
async def update_order(id: int, order_data: OrderCreateRequest, db: Session = Depends(get_db),
                       current_user: UserDB = Depends(verify_role(["admin", "almacenista", "cliente"]))):
    """
    Actualizar una orden.
    Nota: No se permite modificar el comprador; la lógica para actualizar items deberá definirse según el caso de uso.
    """
    order = get_order(db, id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if current_user.role.name == "cliente" and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para actualizar este pedido")
    # Se mantiene el cliente original y se omite la actualización de items en este ejemplo.
    db.commit()
    return {"message": "Pedido actualizado"}

@app.delete("/orders/{id}")
async def cancel_order(id: int, db: Session = Depends(get_db), 
                       current_user: UserDB = Depends(verify_role(["admin", "cliente"]))):
    """Cancelar una orden pendiente (se elimina si no está confirmada)."""
    order = get_order(db, id)
    if not order or order.status != "pending":
        raise HTTPException(status_code=400, detail="El pedido no puede ser cancelado")
    if current_user.role.name == "cliente" and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes cancelar este pedido")
    db.delete(order)
    db.commit()
    return {"message": "Pedido cancelado"}

@app.post("/orders/{id}/confirm")
async def confirm_order(id: int, db: Session = Depends(get_db),
                        current_user: UserDB = Depends(verify_role(["admin", "almacenista"]))):
    """Confirmar una orden y registrar los movimientos económicos correspondientes."""
    order = get_order(db, id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.status = "confirmed"
    db.commit()
    # Registrar movimiento financiero
    financial_movement = FinancialMovementDB(
        order_id=order.id,
        amount=order.total,
        description="Orden confirmada"
    )
    db.add(financial_movement)
    # Registrar movimientos de stock para cada ítem de la orden
    for item in order.items:
        stock_movement = StockMovementDB(
            product_id=item.product_id,
            change=-item.quantity,
            description="Stock disminuido por orden confirmada"
        )
        db.add(stock_movement)
    db.commit()
    return {"message": "Pedido confirmado"}

# -----------------------------
# Endpoints de Movimientos Económicos
# -----------------------------
@app.get("/financial_movements/", response_model=List[FinancialMovement])
async def list_financial_movements(db: Session = Depends(get_db), 
                                   current_user: UserDB = Depends(verify_role(["admin", "almacenista"]))):
    """Listar movimientos financieros."""
    movements = db.query(FinancialMovementDB).all()
    return movements

@app.get("/stock_movements/", response_model=List[StockMovement])
async def list_stock_movements(db: Session = Depends(get_db), 
                               current_user: UserDB = Depends(verify_role(["admin", "almacenista"]))):
    """Listar movimientos de stock."""
    movements = db.query(StockMovementDB).all()
    return movements

@app.get("/upload-url")
def generate_upload_url(
    filename: str = Query(...),
    content_type: str = Query("application/octet-stream")
):
    try:
        presigned_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": filename,
                "ContentType": content_type,
            },
            ExpiresIn=600,
        )
        return {"upload_url": presigned_url}
    except Exception as e:
        print(f"\n🚨 ERROR EN /upload-url 🚨\n{e}\n")
        raise HTTPException(status_code=500, detail=f"Error al generar URL: {str(e)}")

@app.get("/imagen/{filename}")
def get_image_url(filename: str, token: str = Depends(oauth2_scheme)):
    try:
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": filename,
            },
            ExpiresIn=300
        )
        return {"image_url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar URL de imagen: {str(e)}")
    
@app.get(
    "/products/{product_id}/scrape-price",
    dependencies=[Depends(verify_role(["admin", "almacenista"]))]
)
def compare_price_scraping(product_id: int, db: Session = Depends(get_db)):
    product = get_object_or_404(db, ProductDB, product_id)
    query = urllib.parse.quote(product.name.lower())
    url = f"https://www.larebajavirtual.com/{query}?_q={query}&map=ft"

    options = FirefoxOptions()
    options.headless = True

    driver = Remote(
        command_executor=f"http://{SELENIUM_HOST}:{SELENIUM_PORT}/wd/hub",
        options=options
    )

    try:
        driver.get(url)
        time.sleep(5)
        price_elem = driver.find_element(By.CLASS_NAME, "vtex-product-price-1-x-sellingPriceValue")
        precio_rebaja = price_elem.text
    except Exception as e:
        driver.quit()
        raise HTTPException(503, f"Error al scrapear La Rebaja: {e}")
    driver.quit()

    return {
        "producto": product.name,
        "precio_interno": product.price,
        "precio_rebaja": precio_rebaja,
        "url": url
    }

@app.post("/create-payment-intent")
def create_payment_intent(data: CreatePayment, db: Session = Depends(get_db),
                          current_user: UserDB = Depends(verify_role(["cliente", "admin"]))):
    # 1) Carga la orden
    order = db.query(OrderDB).filter(OrderDB.id == data.order_id).first()
    if not order or (current_user.role.name == "cliente" and order.client_id != current_user.id):
        raise HTTPException(404, "Orden no encontrada")
    if order.payment_status == "paid":
        raise HTTPException(400, "Orden ya pagada")

    # 2) Crea un PaymentIntent en Stripe
    intent = stripe.PaymentIntent.create(
        amount=int(order.total * 100),  # Stripe trabaja en centavos
        currency="cop",
        metadata={"order_id": order.id},
    )

    # 3) Guarda el ID en tu base
    order.stripe_payment_intent_id = intent.id
    db.commit()

    # 4) Devuelve al frontend el client_secret
    return {"clientSecret": intent.client_secret}
