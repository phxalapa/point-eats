from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random, string
from app.core.database import get_db
from app.api.deps import get_current_user, require_rol
from app.models.usuario import Usuario, RolUsuario
from app.models.pedido import Pedido, ItemPedido, EstadoPedido
from app.models.restaurante import Restaurante, Platillo
from app.models.mensaje import Mensaje, TipoMensaje

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

def generar_folio():
    letras = ''.join(random.choices(string.ascii_uppercase, k=3))
    numeros = ''.join(random.choices(string.digits, k=4))
    return f"PE-{letras}{numeros}"

class ItemRequest(BaseModel):
    platillo_id: int
    cantidad: int = 1
    notas: Optional[str] = None

class PedidoRequest(BaseModel):
    restaurante_id: int
    items: List[ItemRequest]
    direccion_entrega: Optional[str] = None
    notas: Optional[str] = None

class CambiarEstado(BaseModel):
    estado: EstadoPedido

@router.post("/")
async def crear_pedido(
    data: PedidoRequest,
    user: Usuario = Depends(require_rol(RolUsuario.cliente)),
    db: AsyncSession = Depends(get_db)
):
    # Verificar restaurante abierto
    resto = await db.execute(
        select(Restaurante).where(Restaurante.id == data.restaurante_id)
    )
    restaurante = resto.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    if not restaurante.abierto:
        raise HTTPException(status_code=400, detail="El restaurante está cerrado")

    # Crear pedido
    pedido = Pedido(
        folio=generar_folio(),
        cliente_id=user.id,
        restaurante_id=data.restaurante_id,
        direccion_entrega=data.direccion_entrega,
        notas=data.notas
    )
    db.add(pedido)
    await db.flush()

    # Agregar items con snapshot de precio
    total = 0.0
    for item_data in data.items:
        platillo_result = await db.execute(
            select(Platillo).where(
                Platillo.id == item_data.platillo_id,
                Platillo.restaurante_id == data.restaurante_id,
                Platillo.disponible == True
            )
        )
        platillo = platillo_result.scalar_one_or_none()
        if not platillo:
            raise HTTPException(status_code=404, detail=f"Platillo {item_data.platillo_id} no disponible")

        subtotal = platillo.precio * item_data.cantidad
        total += subtotal

        item = ItemPedido(
            pedido_id=pedido.id,
            platillo_id=platillo.id,
            nombre_snapshot=platillo.nombre,
            precio_snapshot=platillo.precio,
            cantidad=item_data.cantidad,
            subtotal=subtotal,
            notas=item_data.notas
        )
        db.add(item)

    pedido.subtotal = total
    pedido.total = total

    # Mensaje automático de sistema
    msg = Mensaje(
        pedido_id=pedido.id,
        autor_id=None,
        tipo=TipoMensaje.pedido,
        contenido=f"Nuevo pedido {pedido.folio} por ${total:.2f}"
    )
    db.add(msg)

    await db.commit()
    await db.refresh(pedido)

    return {
        "folio": pedido.folio,
        "pedido_id": pedido.id,
        "total": pedido.total,
        "estado": pedido.estado
    }

@router.get("/mis-pedidos")
async def mis_pedidos(
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.rol == RolUsuario.cliente:
        query = select(Pedido).where(Pedido.cliente_id == user.id)
    else:
        resto = await db.execute(
            select(Restaurante).where(Restaurante.usuario_id == user.id)
        )
        restaurante = resto.scalar_one_or_none()
        if not restaurante:
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        query = select(Pedido).where(Pedido.restaurante_id == restaurante.id)

    query = query.order_by(Pedido.creado_en.desc())
    result = await db.execute(query)
    pedidos = result.scalars().all()

    return [
        {
            "id": p.id,
            "folio": p.folio,
            "estado": p.estado,
            "total": p.total,
            "creado_en": p.creado_en,
        }
        for p in pedidos
    ]

@router.patch("/{pedido_id}/estado")
async def cambiar_estado(
    pedido_id: int,
    data: CambiarEstado,
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

    # Mensaje automático de cambio de estado
    emojis = {
        "confirmado": "✅", "preparando": "👨‍🍳",
        "listo": "🎉", "en_camino": "🛵",
        "entregado": "✅", "cancelado": "❌"
    }
    emoji = emojis.get(data.estado, "📢")
    msg = Mensaje(
        pedido_id=pedido_id,
        autor_id=user.id,
        tipo=TipoMensaje.estado,
        contenido=f"{emoji} Tu pedido está: {data.estado.upper()}"
    )
    db.add(msg)
    await db.commit()

    return {"mensaje": f"Estado actualizado a {data.estado}", "folio": pedido.folio} 
