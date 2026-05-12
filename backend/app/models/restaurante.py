from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base

class Restaurante(Base):
    __tablename__ = "restaurantes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    
    # Identidad — lo que ve el cliente en su lista de contactos
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    foto_url = Column(String(500), nullable=True)
    categoria = Column(String(50), nullable=True)  # Tacos, Pizza, Sushi...
    
    # Contacto
    telefono = Column(String(20), nullable=True)
    direccion = Column(String(300), nullable=True)
    ciudad = Column(String(100), nullable=True)
    
    # Estado en tiempo real — el punto verde/gris de WhatsApp
    abierto = Column(Boolean, default=False)
    tiempo_entrega_min = Column(Integer, default=30)  # minutos estimados
    pedido_minimo = Column(Float, default=0.0)
    
    # Métricas visibles al cliente
    calificacion = Column(Float, default=5.0)
    total_pedidos = Column(Integer, default=0)
    
    # Horarios
    horario_apertura = Column(String(5), default="09:00")
    horario_cierre = Column(String(5), default="22:00")
    
    creado_en = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
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
    categoria = Column(String(50), nullable=True)  # Entradas, Principales, Bebidas...
    disponible = Column(Boolean, default=True)
    destacado = Column(Boolean, default=False)  # aparece primero en el menú
    orden = Column(Integer, default=0)
    
    creado_en = Column(DateTime, default=datetime.utcnow)
    
    restaurante = relationship("Restaurante", back_populates="platillos") 
