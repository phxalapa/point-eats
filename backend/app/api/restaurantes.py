from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.models.restaurante import Restaurante, Platillo
from app.models.usuario import RolUsuario, Usuario
from app.api.deps import get_current_user, require_rol

router = APIRouter(prefix="/restaurantes", tags=["Restaurantes"])

# ── Schemas ──────────────────────────────────────────

class RestauranteCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    tiempo_entrega_min: Optional[int] = 30
    pedido_minimo: Optional[float] = 0.0
    horario_apertura: Optional[str] = "09:00"
    horario_cierre: Optional[str] = "22:00"

class PlatilloCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria: Optional[str] = None
    destacado: Optional[bool] = False

class ToggleAbierto(BaseModel):
    abierto: bool

class DatosBancariosUpdate(BaseModel):
    banco_nombre: Optional[str] = None
    banco_titular: Optional[str] = None
    banco_cuenta: Optional[str] = None
    banco_tarjeta: Optional[str] = None
    banco_clabe: Optional[str] = None
    mercadopago_public_key: Optional[str] = None
    mercadopago_access_token: Optional[str] = None

# ── Endpoints cliente ─────────────────────────────────

@router.get("/")
async def listar_restaurantes(
    ciudad: Optional[str] = None,
    categoria: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Restaurante)
    if ciudad:
        query = query.where(Restaurante.ciudad == ciudad)
    if categoria:
        query = query.where(Restaurante.categoria == categoria)
    query = query.order_by(Restaurante.abierto.desc(), Restaurante.calificacion.desc())
    result = await db.execute(query)
    restaurantes = result.scalars().all()
    return [
        {
            "id": r.id,
            "nombre": r.nombre,
            "descripcion": r.descripcion,
            "categoria": r.categoria,
            "foto_url": r.foto_url,
            "abierto": r.abierto,
            "tiempo_entrega_min": r.tiempo_entrega_min,
            "pedido_minimo": r.pedido_minimo,
            "calificacion": r.calificacion,
            "total_pedidos": r.total_pedidos,
            "ciudad": r.ciudad,
        }
        for r in restaurantes
    ]

@router.get("/{restaurante_id}/menu")
async def ver_menu(restaurante_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Restaurante).where(Restaurante.id == restaurante_id)
    )
    restaurante = result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")

    platillos_result = await db.execute(
        select(Platillo)
        .where(Platillo.restaurante_id == restaurante_id)
        .where(Platillo.disponible == True)
        .order_by(Platillo.destacado.desc(), Platillo.orden)
    )
    platillos = platillos_result.scalars().all()

    menu = {}
    for p in platillos:
        cat = p.categoria or "General"
        if cat not in menu:
            menu[cat] = []
        menu[cat].append({
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "precio": p.precio,
            "foto_url": p.foto_url,
            "destacado": p.destacado,
        })

    return {
        "restaurante": {
            "id": restaurante.id,
            "nombre": restaurante.nombre,
            "abierto": restaurante.abierto,
            "tiempo_entrega_min": restaurante.tiempo_entrega_min,
            "pedido_minimo": restaurante.pedido_minimo,
            "calificacion": restaurante.calificacion,
            "banco_nombre": restaurante.banco_nombre,
            "banco_titular": restaurante.banco_titular,
            "banco_cuenta": restaurante.banco_cuenta,
            "banco_tarjeta": restaurante.banco_tarjeta,
            "banco_clabe": restaurante.banco_clabe,
            "mercadopago_public_key": restaurante.mercadopago_public_key,
        },
        "menu": menu
    }

# ── Endpoints restaurante ─────────────────────────────

@router.post("/mi-perfil")
async def crear_perfil(
    data: RestauranteCreate,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    existe = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    if existe.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya tienes un perfil creado")

    restaurante = Restaurante(usuario_id=user.id, **data.model_dump())
    db.add(restaurante)
    await db.commit()
    await db.refresh(restaurante)
    return {"mensaje": "Perfil creado", "restaurante_id": restaurante.id}

@router.post("/mi-perfil/platillo")
async def agregar_platillo(
    data: PlatilloCreate,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    resto_result = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = resto_result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Primero crea tu perfil")

    platillo = Platillo(restaurante_id=restaurante.id, **data.model_dump())
    db.add(platillo)
    await db.commit()
    await db.refresh(platillo)
    return {"mensaje": "Platillo agregado", "platillo_id": platillo.id}

@router.patch("/mi-perfil/estado")
async def toggle_abierto(
    data: ToggleAbierto,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    resto_result = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = resto_result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    restaurante.abierto = data.abierto
    await db.commit()
    estado = "abierto 🟢" if data.abierto else "cerrado 🔴"
    return {"mensaje": f"Restaurante {estado}"}

@router.patch("/mi-perfil/datos-bancarios")
async def actualizar_datos_bancarios(
    data: DatosBancariosUpdate,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    resto_result = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = resto_result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(restaurante, campo, valor)

    await db.commit()
    return {"mensaje": "Datos bancarios actualizados"}
