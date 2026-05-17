from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.models.mensaje import Mensaje, TipoMensaje
from app.models.pedido import Pedido, EstadoPedido
from app.models.restaurante import Restaurante
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

class MensajeRequest(BaseModel):
    contenido: str

class CambiarEstadoRequest(BaseModel):
    estado: EstadoPedido

@router.get("/mis-conversaciones")
async def mis_conversaciones(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lista de conversaciones — vista del restaurante"""
    resto_result = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = resto_result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    pedidos_result = await db.execute(
        select(Pedido)
        .where(Pedido.restaurante_id == restaurante.id)
        .order_by(desc(Pedido.creado_en))
    )
    pedidos = pedidos_result.scalars().all()

    conversaciones = []
    for p in pedidos:
        # Último mensaje del pedido
        ultimo_msg = await db.execute(
            select(Mensaje)
            .where(Mensaje.pedido_id == p.id)
            .order_by(desc(Mensaje.creado_en))
            .limit(1)
        )
        ultimo = ultimo_msg.scalar_one_or_none()

        # Mensajes no leídos
        no_leidos = await db.execute(
            select(Mensaje)
            .where(Mensaje.pedido_id == p.id)
            .where(Mensaje.leido == False)
            .where(Mensaje.autor_id != user.id)
        )
        count_no_leidos = len(no_leidos.scalars().all())

        # Info del cliente
        cliente_result = await db.execute(
            select(Usuario).where(Usuario.id == p.cliente_id)
        )
        cliente = cliente_result.scalar_one_or_none()

        conversaciones.append({
            "pedido_id": p.id,
            "folio": p.folio,
            "estado": p.estado,
            "total": p.total,
            "creado_en": p.creado_en,
            "cliente_nombre": cliente.nombre if cliente else "Cliente",
            "cliente_telefono": cliente.telefono if cliente else None,
            "ultimo_mensaje": ultimo.contenido if ultimo else "Sin mensajes",
            "ultimo_mensaje_hora": ultimo.creado_en if ultimo else p.creado_en,
            "no_leidos": count_no_leidos,
        })

    return conversaciones

@router.get("/{pedido_id}")
async def obtener_mensajes(
    pedido_id: int,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Marcar mensajes como leídos
    msgs_result = await db.execute(
        select(Mensaje)
        .where(Mensaje.pedido_id == pedido_id)
        .where(Mensaje.autor_id != user.id)
        .where(Mensaje.leido == False)
    )
    for msg in msgs_result.scalars().all():
        msg.leido = True
    await db.commit()

    result = await db.execute(
        select(Mensaje)
        .where(Mensaje.pedido_id == pedido_id)
        .order_by(Mensaje.creado_en.asc())
    )
    mensajes = result.scalars().all()

    # Info del pedido
    pedido_result = await db.execute(select(Pedido).where(Pedido.id == pedido_id))
    pedido = pedido_result.scalar_one_or_none()

    return {
        "pedido": {
            "id": pedido.id,
            "folio": pedido.folio,
            "estado": pedido.estado,
            "total": pedido.total,
            "creado_en": pedido.creado_en,
            "cliente_id": pedido.cliente_id,
        } if pedido else None,
        "mensajes": [
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
    }

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

@router.patch("/{pedido_id}/estado")
async def cambiar_estado_desde_chat(
    pedido_id: int,
    data: CambiarEstadoRequest,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Pedido).where(Pedido.id == pedido_id))
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    pedido.estado = data.estado
    if data.estado == EstadoPedido.entregado:
        pedido.entregado_en = datetime.utcnow()

    emojis = {
        "confirmado": "✅", "preparando": "👨‍🍳",
        "listo": "🎉", "en_camino": "🛵",
        "entregado": "✅ Entregado", "cancelado": "❌"
    }
    emoji = emojis.get(data.estado.value, "📢")

    msg = Mensaje(
        pedido_id=pedido_id,
        autor_id=user.id,
        tipo=TipoMensaje.estado,
        contenido=f"{emoji} Tu pedido está: {data.estado.value.upper()}"
    )
    db.add(msg)
    await db.commit()

    return {"mensaje": f"Estado actualizado a {data.estado}", "folio": pedido.folio}
