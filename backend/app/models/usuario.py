from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime
import enum

class Base(DeclarativeBase):
    pass

class RolUsuario(str, enum.Enum):
    cliente = "cliente"
    restaurante = "restaurante"
    admin = "admin"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    telefono = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), default=RolUsuario.cliente)
    activo = Column(Boolean, default=True)
    foto_url = Column(String(500), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    ultimo_acceso = Column(DateTime, nullable=True)