from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base
import enum

class TipoMensaje(str, enum.Enum):
    texto       = "texto"
    menu        = "menu"         # burbuja especial con el menú
    pedido      = "pedido"       # burbuja con resumen del pedido
    estado      = "estado"       # cambio de estado del pedido
    pago        = "pago"         # instrucciones de pago
    sistema     = "sistema"      # mensajes automáticos

class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    tipo = Column(Enum(TipoMensaje), default=TipoMensaje.texto)
    contenido = Column(Text, nullable=False)
    
    leido = Column(Boolean, default=False)
    creado_en = Column(DateTime, default=datetime.utcnow)
    
    pedido = relationship("Pedido", back_populates="mensajes") 
