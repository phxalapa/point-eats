from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base

class Restaurante(Base):
    __tablename__ = "restaurantes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    foto_url = Column(String(500), nullable=True)
    categoria = Column(String(50), nullable=True)
    telefono = Column(String(20), nullable=True)
    direccion = Column(String(300), nullable=True)
    ciudad = Column(String(100), nullable=True)
    abierto = Column(Boolean, default=False)
    tiempo_entrega_min = Column(Integer, default=30)
    pedido_minimo = Column(Float, default=0.0)
    calificacion = Column(Float, default=5.0)
    total_pedidos = Column(Integer, default=0)
    horario_apertura = Column(String(5), default="09:00")
    horario_cierre = Column(String(5), default="22:00")

    # Datos bancarios
    banco_nombre = Column(String(100), nullable=True)
    banco_titular = Column(String(150), nullable=True)
    banco_cuenta = Column(String(50), nullable=True)
    banco_tarjeta = Column(String(50), nullable=True)
    banco_clabe = Column(String(50), nullable=True)
    mercadopago_public_key = Column(String(200), nullable=True)
    mercadopago_access_token = Column(String(200), nullable=True)

    creado_en = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", backref="restaurante")
    platillos = relationship("Platillo", back_populates="restaurante")


class Platillo(Base):
    __tablename__ = "platillos"

    id = Column(Integer, primary_key=True, index=True)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(Float, nullable=False)
    foto_url = Column(String(500), nullable=True)
    categoria = Column(String(50), nullable=True)
    disponible = Column(Boolean, default=True)
    destacado = Column(Boolean, default=False)
    orden = Column(Integer, default=0)
    creado_en = Column(DateTime, default=datetime.utcnow)

    restaurante = relationship("Restaurante", back_populates="platillos")