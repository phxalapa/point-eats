from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import crear_token
from app.api.deps import require_rol
from app.models.usuario import Usuario, RolUsuario
from app.models.restaurante import Restaurante
from app.models.pedido import Pedido

router = APIRouter(prefix="/admin", tags=["Super Admin"])

class SuspenderRequest(BaseModel):
    activo: bool
    motivo: Optional[str] = None

class EditarRestauranteRequest(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    tiempo_entrega_min: Optional[int] = None
    pedido_minimo: Optional[float] = None

# ── Dashboard global ───────────────────────────────────

@router.get("/dashboard")
async def dashboard_global(
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    # Total usuarios
    total_usuarios = await db.execute(select(func.count(Usuario.id)))
    total_clientes = await db.execute(
        select(func.count(Usuario.id)).where(Usuario.rol == RolUsuario.cliente)
    )
    total_restaurantes = await db.execute(
        select(func.count(Usuario.id)).where(Usuario.rol == RolUsuario.restaurante)
    )

    # Total pedidos
    total_pedidos = await db.execute(select(func.count(Pedido.id)))
    total_ventas = await db.execute(select(func.sum(Pedido.total)))

    # Pedidos hoy
    hoy = datetime.utcnow().date()
    pedidos_hoy = await db.execute(
        select(func.count(Pedido.id)).where(
            func.date(Pedido.creado_en) == hoy
        )
    )
    ventas_hoy = await db.execute(
        select(func.sum(Pedido.total)).where(
            func.date(Pedido.creado_en) == hoy
        )
    )

    # Restaurantes activos
    restaurantes_abiertos = await db.execute(
        select(func.count(Restaurante.id)).where(Restaurante.abierto == True)
    )

    return {
        "usuarios": {
            "total": total_usuarios.scalar() or 0,
            "clientes": total_clientes.scalar() or 0,
            "restaurantes": total_restaurantes.scalar() or 0,
        },
        "pedidos": {
            "total": total_pedidos.scalar() or 0,
            "hoy": pedidos_hoy.scalar() or 0,
        },
        "ventas": {
            "total": float(total_ventas.scalar() or 0),
            "hoy": float(ventas_hoy.scalar() or 0),
        },
        "restaurantes_abiertos": restaurantes_abiertos.scalar() or 0,
    }

# ── Restaurantes ───────────────────────────────────────

@router.get("/restaurantes")
async def listar_restaurantes_admin(
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurante).order_by(desc(Restaurante.creado_en))
    )
    restaurantes = result.scalars().all()

    lista = []
    for r in restaurantes:
        # Contar pedidos
        pedidos_count = await db.execute(
            select(func.count(Pedido.id)).where(Pedido.restaurante_id == r.id)
        )
        ventas_total = await db.execute(
            select(func.sum(Pedido.total)).where(Pedido.restaurante_id == r.id)
        )
        # Obtener usuario
        usuario = await db.execute(
            select(Usuario).where(Usuario.id == r.usuario_id)
        )
        usr = usuario.scalar_one_or_none()

        lista.append({
            "id": r.id,
            "usuario_id": r.usuario_id,
            "nombre": r.nombre,
            "categoria": r.categoria,
            "ciudad": r.ciudad,
            "foto_url": r.foto_url,
            "abierto": r.abierto,
            "calificacion": r.calificacion,
            "total_pedidos": pedidos_count.scalar() or 0,
            "total_ventas": float(ventas_total.scalar() or 0),
            "email": usr.email if usr else None,
            "telefono": usr.telefono if usr else None,
            "activo": usr.activo if usr else True,
            "creado_en": r.creado_en,
        })

    return lista

@router.get("/restaurantes/{restaurante_id}")
async def detalle_restaurante_admin(
    restaurante_id: int,
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurante).where(Restaurante.id == restaurante_id)
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")

    usr_result = await db.execute(select(Usuario).where(Usuario.id == r.usuario_id))
    usr = usr_result.scalar_one_or_none()

    pedidos_result = await db.execute(
        select(Pedido).where(Pedido.restaurante_id == restaurante_id)
        .order_by(desc(Pedido.creado_en)).limit(10)
    )
    pedidos = pedidos_result.scalars().all()

    return {
        "restaurante": {
            "id": r.id,
            "nombre": r.nombre,
            "descripcion": r.descripcion,
            "categoria": r.categoria,
            "foto_url": r.foto_url,
            "portada_url": r.portada_url,
            "direccion": r.direccion,
            "ciudad": r.ciudad,
            "telefono": r.telefono,
            "maps_url": r.maps_url,
            "abierto": r.abierto,
            "tiempo_entrega_min": r.tiempo_entrega_min,
            "pedido_minimo": r.pedido_minimo,
            "horario_apertura": r.horario_apertura,
            "horario_cierre": r.horario_cierre,
            "calificacion": r.calificacion,
            "creado_en": r.creado_en,
        },
        "usuario": {
            "id": usr.id if usr else None,
            "nombre": usr.nombre if usr else None,
            "email": usr.email if usr else None,
            "telefono": usr.telefono if usr else None,
            "activo": usr.activo if usr else True,
        },
        "ultimos_pedidos": [
            {
                "id": p.id,
                "folio": p.folio,
                "estado": p.estado,
                "total": p.total,
                "creado_en": p.creado_en,
            }
            for p in pedidos
        ]
    }

@router.patch("/restaurantes/{restaurante_id}")
async def editar_restaurante_admin(
    restaurante_id: int,
    data: EditarRestauranteRequest,
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurante).where(Restaurante.id == restaurante_id)
    )
    restaurante = result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")

    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(restaurante, campo, valor)

    await db.commit()
    return {"mensaje": "Restaurante actualizado"}

# ── Suspender / activar cuenta ─────────────────────────

@router.patch("/usuarios/{usuario_id}/suspender")
async def suspender_usuario(
    usuario_id: int,
    data: SuspenderRequest,
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario.id == user.id:
        raise HTTPException(status_code=400, detail="No puedes suspenderte a ti mismo")

    usuario.activo = data.activo
    await db.commit()
    estado = "activado" if data.activo else "suspendido"
    return {"mensaje": f"Usuario {estado}", "usuario_id": usuario_id}

# ── Impersonar restaurante ─────────────────────────────

@router.post("/impersonar/{usuario_id}")
async def impersonar_restaurante(
    usuario_id: int,
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    """Genera un token temporal para entrar al panel de un restaurante"""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    target = result.scalar_one_or_none()

    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target.rol != RolUsuario.restaurante:
        raise HTTPException(status_code=400, detail="Solo se puede impersonar restaurantes")

    # Token temporal de 2 horas con marca de impersonación
    token = crear_token({
        "sub": str(target.id),
        "rol": target.rol,
        "impersonado_por": user.id,
        "impersonacion": True
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": target.rol,
        "nombre": target.nombre,
        "id": target.id,
        "advertencia": "Token de impersonación — válido por 7 días"
    }

# ── Usuarios ───────────────────────────────────────────

@router.get("/usuarios")
async def listar_usuarios_admin(
    rol: Optional[str] = None,
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Usuario).order_by(desc(Usuario.creado_en))
    if rol:
        query = query.where(Usuario.rol == rol)
    result = await db.execute(query)
    usuarios = result.scalars().all()

    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "email": u.email,
            "telefono": u.telefono,
            "rol": u.rol,
            "activo": u.activo,
            "creado_en": u.creado_en,
            "ultimo_acceso": u.ultimo_acceso,
        }
        for u in usuarios
    ]

# ── Pedidos globales ───────────────────────────────────

@router.get("/pedidos")
async def pedidos_globales(
    user: Usuario = Depends(require_rol(RolUsuario.admin)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Pedido).order_by(desc(Pedido.creado_en)).limit(100)
    )
    pedidos = result.scalars().all()

    lista = []
    for p in pedidos:
        cliente = await db.execute(select(Usuario).where(Usuario.id == p.cliente_id))
        c = cliente.scalar_one_or_none()
        resto = await db.execute(select(Restaurante).where(Restaurante.id == p.restaurante_id))
        r = resto.scalar_one_or_none()

        lista.append({
            "id": p.id,
            "folio": p.folio,
            "estado": p.estado,
            "total": p.total,
            "creado_en": p.creado_en,
            "cliente_nombre": c.nombre if c else "?",
            "restaurante_nombre": r.nombre if r else "?",
        })

    return lista
