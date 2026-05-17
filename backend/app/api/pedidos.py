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
    resto = await db.execute(
        select(Restaurante).where(Restaurante.id == data.restaurante_id)
    )
    restaurante = resto.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    if not restaurante.abierto:
        raise HTTPException(status_code=400, detail="El restaurante está cerrado")

    pedido = Pedido(
        folio=generar_folio(),
        cliente_id=user.id,
        restaurante_id=data.restaurante_id,
        direccion_entrega=data.direccion_entrega,
        notas=data.notas
    )
    db.add(pedido)
    await db.flush()

    total = 0.0
    items_detalle = []
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
        items_detalle.append({
            "nombre": platillo.nombre,
            "cantidad": item_data.cantidad,
            "precio": platillo.precio,
            "subtotal": subtotal
        })

    pedido.subtotal = total
    pedido.total = total

    # Mensaje automático con detalle del pedido
    detalle_texto = "\n".join([f"• {i['cantidad']}x {i['nombre']} — ${i['subtotal']:.2f}" for i in items_detalle])
    msg = Mensaje(
        pedido_id=pedido.id,
        autor_id=None,
        tipo=TipoMensaje.pedido,
        contenido=f"🛒 Nuevo pedido {pedido.folio}\n{detalle_texto}\n💰 Total: ${total:.2f}"
    )
    db.add(msg)
    await db.commit()
    await db.refresh(pedido)

    return {
        "folio": pedido.folio,
        "pedido_id": pedido.id,
        "total": pedido.total,
        "estado": pedido.estado,
        "items": items_detalle
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

    pedidos_completos = []
    for p in pedidos:
        items_result = await db.execute(
            select(ItemPedido).where(ItemPedido.pedido_id == p.id)
        )
        items = items_result.scalars().all()

        cliente_result = await db.execute(
            select(Usuario).where(Usuario.id == p.cliente_id)
        )
        cliente = cliente_result.scalar_one_or_none()

        pedidos_completos.append({
            "id": p.id,
            "folio": p.folio,
            "estado": p.estado,
            "total": p.total,
            "subtotal": p.subtotal,
            "notas": p.notas,
            "direccion_entrega": p.direccion_entrega,
            "creado_en": p.creado_en,
            "confirmado_en": p.confirmado_en,
            "entregado_en": p.entregado_en,
            "cliente_nombre": cliente.nombre if cliente else "Cliente",
            "cliente_telefono": cliente.telefono if cliente else None,
            "items": [
                {
                    "id": i.id,
                    "nombre": i.nombre_snapshot,
                    "precio": i.precio_snapshot,
                    "cantidad": i.cantidad,
                    "subtotal": i.subtotal,
                    "notas": i.notas
                }
                for i in items
            ]
        })

    return pedidos_completos

@router.get("/{pedido_id}/detalle")
async def detalle_pedido(
    pedido_id: int,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Pedido).where(Pedido.id == pedido_id))
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    items_result = await db.execute(
        select(ItemPedido).where(ItemPedido.pedido_id == pedido_id)
    )
    items = items_result.scalars().all()

    cliente_result = await db.execute(
        select(Usuario).where(Usuario.id == pedido.cliente_id)
    )
    cliente = cliente_result.scalar_one_or_none()

    resto_result = await db.execute(
        select(Restaurante).where(Restaurante.id == pedido.restaurante_id)
    )
    restaurante = resto_result.scalar_one_or_none()

    return {
        "id": pedido.id,
        "folio": pedido.folio,
        "estado": pedido.estado,
        "total": pedido.total,
        "subtotal": pedido.subtotal,
        "notas": pedido.notas,
        "direccion_entrega": pedido.direccion_entrega,
        "creado_en": pedido.creado_en,
        "cliente": {
            "nombre": cliente.nombre if cliente else "Cliente",
            "telefono": cliente.telefono if cliente else None,
            "email": cliente.email if cliente else None,
        },
        "restaurante": {
            "nombre": restaurante.nombre if restaurante else "",
            "direccion": restaurante.direccion if restaurante else "",
            "telefono": restaurante.telefono if restaurante else "",
        },
        "items": [
            {
                "id": i.id,
                "nombre": i.nombre_snapshot,
                "precio": i.precio_snapshot,
                "cantidad": i.cantidad,
                "subtotal": i.subtotal,
                "notas": i.notas
            }
            for i in items
        ]
    }

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
    if data.estado == EstadoPedido.confirmado:
        pedido.confirmado_en = datetime.utcnow()

    emojis = {
        "confirmado": "✅", "preparando": "👨‍🍳",
        "listo": "🎉", "en_camino": "🛵",
        "entregado": "✅", "cancelado": "❌"
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
