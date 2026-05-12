from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.models.mensaje import Mensaje, TipoMensaje
from app.models.pedido import Pedido

router = APIRouter(prefix="/chat", tags=["Chat"])

class MensajeRequest(BaseModel):
    contenido: str

@router.get("/{pedido_id}")
async def obtener_mensajes(
    pedido_id: int,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Mensaje)
        .where(Mensaje.pedido_id == pedido_id)
        .order_by(Mensaje.creado_en.asc())
    )
    mensajes = result.scalars().all()
    return [
        {
            "id": m.id,
            "autor_id": m.autor_id,
            "tipo": m.tipo,
            "contenido": m.contenido,
            "leido": m.leido,
            "creado_en": m.creado_en,
            "es_mio": m.autor_id == user.id
        }
        for m in mensajes
    ]

@router.post("/{pedido_id}")
async def enviar_mensaje(
    pedido_id: int,
    data: MensajeRequest,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    pedido_result = await db.execute(select(Pedido).where(Pedido.id == pedido_id))
    pedido = pedido_result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    msg = Mensaje(
        pedido_id=pedido_id,
        autor_id=user.id,
        tipo=TipoMensaje.texto,
        contenido=data.contenido
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return {
        "id": msg.id,
        "contenido": msg.contenido,
        "creado_en": msg.creado_en,
        "tipo": msg.tipo
    }
