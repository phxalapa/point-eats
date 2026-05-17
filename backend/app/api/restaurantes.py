from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import cloudinary
import cloudinary.uploader
from app.core.database import get_db
from app.core.config import settings
from app.models.restaurante import Restaurante, Platillo
from app.models.usuario import RolUsuario, Usuario
from app.api.deps import get_current_user, require_rol

router = APIRouter(prefix="/restaurantes", tags=["Restaurantes"])

# Configurar Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

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

class RestauranteUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    maps_url: Optional[str] = None
    tiempo_entrega_min: Optional[int] = None
    pedido_minimo: Optional[float] = None
    horario_apertura: Optional[str] = None
    horario_cierre: Optional[str] = None
    foto_url: Optional[str] = None
    portada_url: Optional[str] = None

class PlatilloCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria: Optional[str] = None
    destacado: Optional[bool] = False
    foto_url: Optional[str] = None

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
            "portada_url": r.portada_url if hasattr(r, 'portada_url') else None,
            "abierto": r.abierto,
            "tiempo_entrega_min": r.tiempo_entrega_min,
            "pedido_minimo": r.pedido_minimo,
            "calificacion": r.calificacion,
            "total_pedidos": r.total_pedidos,
            "ciudad": r.ciudad,
            "maps_url": r.maps_url if hasattr(r, 'maps_url') else None,
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
            "descripcion": restaurante.descripcion,
            "foto_url": restaurante.foto_url,
            "portada_url": restaurante.portada_url if hasattr(restaurante, 'portada_url') else None,
            "categoria": restaurante.categoria,
            "direccion": restaurante.direccion,
            "telefono": restaurante.telefono,
            "maps_url": restaurante.maps_url if hasattr(restaurante, 'maps_url') else None,
            "abierto": restaurante.abierto,
            "tiempo_entrega_min": restaurante.tiempo_entrega_min,
            "pedido_minimo": restaurante.pedido_minimo,
            "calificacion": restaurante.calificacion,
            "horario_apertura": restaurante.horario_apertura,
            "horario_cierre": restaurante.horario_cierre,
            "banco_nombre": restaurante.banco_nombre,
            "banco_titular": restaurante.banco_titular,
            "banco_cuenta": restaurante.banco_cuenta,
            "banco_tarjeta": restaurante.banco_tarjeta,
            "banco_clabe": restaurante.banco_clabe,
            "mercadopago_public_key": restaurante.mercadopago_public_key,
        },
        "menu": menu
    }

@router.get("/mi-perfil/info")
async def mi_perfil_info(
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return {
        "id": restaurante.id,
        "nombre": restaurante.nombre,
        "descripcion": restaurante.descripcion,
        "categoria": restaurante.categoria,
        "foto_url": restaurante.foto_url,
        "portada_url": restaurante.portada_url if hasattr(restaurante, 'portada_url') else None,
        "telefono": restaurante.telefono,
        "direccion": restaurante.direccion,
        "ciudad": restaurante.ciudad,
        "maps_url": restaurante.maps_url if hasattr(restaurante, 'maps_url') else None,
        "abierto": restaurante.abierto,
        "tiempo_entrega_min": restaurante.tiempo_entrega_min,
        "pedido_minimo": restaurante.pedido_minimo,
        "calificacion": restaurante.calificacion,
        "horario_apertura": restaurante.horario_apertura,
        "horario_cierre": restaurante.horario_cierre,
        "banco_nombre": restaurante.banco_nombre,
        "banco_titular": restaurante.banco_titular,
        "banco_cuenta": restaurante.banco_cuenta,
        "banco_tarjeta": restaurante.banco_tarjeta,
        "banco_clabe": restaurante.banco_clabe,
        "mercadopago_public_key": restaurante.mercadopago_public_key,
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

@router.patch("/mi-perfil")
async def actualizar_perfil(
    data: RestauranteUpdate,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    for campo, valor in data.model_dump(exclude_none=True).items():
        if hasattr(restaurante, campo):
            setattr(restaurante, campo, valor)

    await db.commit()
    return {"mensaje": "Perfil actualizado"}

@router.post("/mi-perfil/foto")
async def subir_foto_perfil(
    file: UploadFile = File(...),
    tipo: str = "perfil",
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Restaurante).where(Restaurante.usuario_id == user.id)
    )
    restaurante = result.scalar_one_or_none()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    tipos_ok = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in tipos_ok:
        raise HTTPException(status_code=400, detail="Solo JPG, PNG o WEBP")

    contenido = await file.read()
    if len(contenido) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Máximo 5MB")

    try:
        carpeta = "pointeats/perfiles" if tipo == "perfil" else "pointeats/portadas"
        transform = [{"width": 400, "height": 400, "crop": "fill"}] if tipo == "perfil" \
            else [{"width": 1200, "height": 400, "crop": "fill"}]

        resultado = cloudinary.uploader.upload(
            contenido,
            folder=carpeta,
            transformation=transform + [{"quality": "auto"}, {"fetch_format": "auto"}]
        )
        url = resultado["secure_url"]

        if tipo == "perfil":
            restaurante.foto_url = url
        else:
            if hasattr(restaurante, 'portada_url'):
                restaurante.portada_url = url

        await db.commit()
        return {"url": url, "tipo": tipo}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

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
