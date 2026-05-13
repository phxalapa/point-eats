from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.usuario import Base
import enum

class TipoMedia(str, enum.Enum):
    imagen = "imagen"
    video = "video"

class Promocion(Base):
    __tablename__ = "promociones"

    id = Column(Integer, primary_key=True, index=True)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False)
    platillo_id = Column(Integer, ForeignKey("platillos.id"), nullable=True)

    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    tipo = Column(Enum(TipoMedia), default=TipoMedia.imagen)

    # URL de Cloudinary
    media_url = Column(String(500), nullable=False)
    public_id = Column(String(200), nullable=True)  # ID en Cloudinary para borrar

    # Precio especial de promoción
    precio_promo = Column(Float, nullable=True)

    # Control
    tiene_boton_agregar = Column(Boolean, default=True)
    activa = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

    restaurante = relationship("Restaurante", backref="promociones")
    platillo = relationship("Platillo", backref="promociones") 
