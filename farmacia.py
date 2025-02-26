import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, func, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime

DATABASE_URL = "sqlite:///./bachedotachinco.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class RoleDB(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("RoleDB")

class ProductDB(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    stock = Column(Integer)
    price = Column(Integer)

Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
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
    
    admin_user = db.query(UserDB).filter_by(username="admin").first()
    if not admin_user:
        admin_user = UserDB(
            username="admin",
            hashed_password=pwd_context.hash("fasapisecrets"),
            role_id=admin_role.id
        )
        db.add(admin_user)
        db.commit()
    db.close()

init_db()

class User(BaseModel):
    username: str
    disabled: bool = False
    role: str

class Product(BaseModel):
    name: str
    stock: int
    price: int

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(db: Session, username: str):
    return db.query(UserDB).filter(UserDB.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = get_user(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def verify_role(required_role: str):
    def role_checker(current_user: UserDB = Depends(get_current_user)):
        if current_user.role.name != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado, se requiere rol {required_role}"
            )
        return current_user
    return role_checker

app = FastAPI()

@app.post("/register", dependencies=[Depends(verify_role("admin"))])
async def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = get_user(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    role = db.query(RoleDB).filter(RoleDB.name == user.role).first()
    if not role:
        raise HTTPException(status_code=400, detail="Rol inválido")
    new_user = UserDB(username=user.username, hashed_password=get_password_hash(user.password), role_id=role.id)
    db.add(new_user)
    db.commit()
    return {"message": "Usuario registrado exitosamente"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de usuario o contraseña incorrectos"
        )
    return {"access_token": user.username, "token_type": "bearer"}

@app.get("/users/", response_model=list[User])
async def list_users(db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role("admin"))):
    users = db.query(UserDB).all()
    return [{"username": user.username, "disabled": user.disabled, "role": user.role.name} for user in users]

@app.get("/users/{id}")
async def get_user_by_id(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role("admin"))):
    user = db.query(UserDB).filter(UserDB.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"username": user.username, "disabled": user.disabled, "role": user.role.name}

@app.put("/users/{id}")
async def update_user(id: int, user_data: UserCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role("admin"))):
    user = db.query(UserDB).filter(UserDB.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.username = user_data.username
    user.hashed_password = get_password_hash(user_data.password)
    db.commit()
    return {"message": "Usuario actualizado exitosamente"}

@app.delete("/users/{id}")
async def delete_user(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role("admin"))):
    user = db.query(UserDB).filter(UserDB.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado exitosamente"}

# Módulo de Productos y Stock

class ProductCreate(BaseModel):
    name: str
    stock: int
    price: int

@app.post("/products/", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def create_product(product: Product, db: Session = Depends(get_db)):
    new_product = ProductDB(name=product.name, stock=product.stock, price=product.price)
    db.add(new_product)
    db.commit()
    return {"message": "Producto agregado exitosamente"}

@app.get("/products/")
async def list_products(db: Session = Depends(get_db)):
    products = db.query(ProductDB).all()
    return products

@app.get("/products/{id}")
async def get_product(id: int, db: Session = Depends(get_db)):
    product = db.query(ProductDB).filter(ProductDB.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@app.put("/products/{id}", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def update_product(id: int, product_data: Product, db: Session = Depends(get_db)):
    product = db.query(ProductDB).filter(ProductDB.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    product.name = product_data.name
    product.stock = product_data.stock
    product.price = product_data.price
    db.commit()
    return {"message": "Producto actualizado exitosamente"}

@app.delete("/products/{id}", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(ProductDB).filter(ProductDB.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(product)
    db.commit()
    return {"message": "Producto eliminado exitosamente"}

@app.delete("/products/out-of-stock", dependencies=[Depends(verify_role(["admin", "almacenista"]))])
async def delete_out_of_stock_products(db: Session = Depends(get_db)):
    db.query(ProductDB).filter(ProductDB.stock == 0).delete()
    db.commit()
    return {"message": "Productos sin stock eliminados exitosamente"}

# Módulo de Ventas y Pedidos

class OrderDB(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")
    total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    client = relationship("UserDB")

Base.metadata.create_all(bind=engine)

class OrderCreate(BaseModel):
    client_id: int
    total: float

class SaleDB(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    order = relationship("OrderDB")

Base.metadata.create_all(bind=engine)

class SaleCreate(BaseModel):
    order_id: int
    amount: float

def get_order(db: Session, order_id: int):
    return db.query(OrderDB).filter(OrderDB.id == order_id).first()

def get_sale(db: Session, sale_id: int):
    return db.query(SaleDB).filter(SaleDB.id == sale_id).first()

@app.post("/orders/")
async def create_order(order: OrderCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["cliente", "admin"]))):
    if current_user.role == "cliente" and current_user.id != order.client_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para crear este pedido")
    new_order = OrderDB(client_id=order.client_id, total=order.total)
    db.add(new_order)
    db.commit()
    return {"message": "Pedido creado exitosamente"}

@app.get("/orders/")
async def list_orders(db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista", "cliente"]))):
    if current_user.role == "cliente":
        return db.query(OrderDB).filter(OrderDB.client_id == current_user.id).all()
    return db.query(OrderDB).all()

@app.get("/orders/{id}")
async def get_order_details(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista", "cliente"]))):
    order = get_order(db, id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if current_user.role == "cliente" and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este pedido")
    return order

@app.put("/orders/{id}")
async def update_order(id: int, order_data: OrderCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista", "cliente"]))):
    order = get_order(db, id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if current_user.role == "cliente" and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para actualizar este pedido")
    order.client_id = order_data.client_id
    order.total = order_data.total
    db.commit()
    return {"message": "Pedido actualizado"}

@app.delete("/orders/{id}")
async def cancel_order(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "cliente"]))):
    order = get_order(db, id)
    if not order or order.status != "pending":
        raise HTTPException(status_code=400, detail="El pedido no puede ser cancelado")
    if current_user.role == "cliente" and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes cancelar este pedido")
    db.delete(order)
    db.commit()
    return {"message": "Pedido cancelado"}

@app.post("/orders/{id}/confirm")
async def confirm_order(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista"]))):
    order = get_order(db, id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.status = "confirmed"
    db.commit()
    return {"message": "Pedido confirmado"}

@app.post("/orders/{id}/deliver")
async def deliver_order(id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["almacenista"]))):
    order = get_order(db, id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.status = "delivered"
    db.commit()
    return {"message": "Pedido entregado"}

@app.post("/sales/")
async def create_sale(sale: SaleCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista"]))):
    order = get_order(db, sale.order_id)
    if not order or order.status != "confirmed":
        raise HTTPException(status_code=400, detail="No se puede registrar la venta")
    new_sale = SaleDB(order_id=sale.order_id, amount=sale.amount)
    db.add(new_sale)
    db.commit()
    return {"message": "Venta registrada exitosamente"}

@app.get("/sales/")
async def list_sales(db: Session = Depends(get_db), current_user: UserDB = Depends(verify_role(["admin", "almacenista"]))):
    sales = db.query(SaleDB).all()
    return sales
