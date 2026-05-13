from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.models.restaurante import Restaurante
from app.models.promocion import Promocion, TipoMedia

router = APIRouter(prefix="/promociones", tags=["Promociones"])

class PromocionCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    tipo: TipoMedia = TipoMedia.imagen
    media_url: str
    public_id: Optional[str] = None
    platillo_id: Optional[int] = None
    precio_promo: Optional[float] = None
    tiene_boton_agregar: bool = True

@router.post("/")
async def crear_promocion(
    data: PromocionCreate,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    resto = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = resto.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    promo = Promocion(
        restaurante_id=restaurante.id,
        platillo_id=data.platillo_id,
        titulo=data.titulo,
        descripcion=data.descripcion,
        tipo=data.tipo,
        media_url=data.media_url,
        public_id=data.public_id,
        precio_promo=data.precio_promo,
        tiene_boton_agregar=data.tiene_boton_agregar
    )
    db.add(promo)
    await db.commit()
    await db.refresh(promo)
    return {"mensaje": "Promoción creada", "promocion_id": promo.id}

@router.get("/restaurante/{restaurante_id}")
async def ver_promociones(restaurante_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Promocion)
        .where(Promocion.restaurante_id == restaurante_id)
        .where(Promocion.activa == True)
        .order_by(Promocion.creado_en.desc())
    )
    promociones = result.scalars().all()
    return [
        {
            "id": p.id,
            "titulo": p.titulo,
            "descripcion": p.descripcion,
            "tipo": p.tipo,
            "media_url": p.media_url,
            "precio_promo": p.precio_promo,
            "tiene_boton_agregar": p.tiene_boton_agregar,
            "platillo_id": p.platillo_id
        }
        for p in promociones
    ]

@router.patch("/{promo_id}/toggle")
async def toggle_promocion(
    promo_id: int,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Promocion).where(Promocion.id == promo_id))
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    promo.activa = not promo.activa
    await db.commit()
    return {"mensaje": f"Promoción {'activada' if promo.activa else 'desactivada'}"}

@router.delete("/{promo_id}")
async def eliminar_promocion(
    promo_id: int,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Promocion).where(Promocion.id == promo_id))
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(status_code=404, detail="Promoción no encontrada")
    await db.delete(promo)
    await db.commit()
    return {"mensaje": "Promoción eliminada"} 
