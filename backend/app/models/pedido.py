from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base
import enum

class EstadoPedido(str, enum.Enum):
    pendiente   = "pendiente"    # cliente envió el pedido
    confirmado  = "confirmado"   # restaurante aceptó
    preparando  = "preparando"   # en cocina
    listo       = "listo"        # listo para entregar
    en_camino   = "en_camino"    # repartidor en ruta
    entregado   = "entregado"    # entregado al cliente
    cancelado   = "cancelado"    # cancelado

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    folio = Column(String(20), unique=True, nullable=False)
    
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False)
    
    estado = Column(Enum(EstadoPedido), default=EstadoPedido.pendiente)
    
    # Totales
    subtotal = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    # Entrega
    direccion_entrega = Column(String(300), nullable=True)
    notas = Column(Text, nullable=True)
    
    # Tiempos
    creado_en = Column(DateTime, default=datetime.utcnow)
    confirmado_en = Column(DateTime, nullable=True)
    entregado_en = Column(DateTime, nullable=True)
    
    # Relaciones
    items = relationship("ItemPedido", back_populates="pedido")
    mensajes = relationship("Mensaje", back_populates="pedido")

class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    platillo_id = Column(Integer, ForeignKey("platillos.id"), nullable=False)
    
    # Snapshot — guardamos el precio al momento del pedido
    nombre_snapshot = Column(String(150), nullable=False)
    precio_snapshot = Column(Float, nullable=False)
    cantidad = Column(Integer, default=1)
    subtotal = Column(Float, default=0.0)
    notas = Column(Text, nullable=True)
    
    pedido = relationship("Pedido", back_populates="items") 
