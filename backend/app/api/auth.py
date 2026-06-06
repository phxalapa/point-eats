from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import hash_password, verify_password, crear_token
from app.models.usuario import Usuario, RolUsuario
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])

class RegistroRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    rol: RolUsuario = RolUsuario.cliente

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str
    id: int

class PerfilUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    foto_url: Optional[str] = None

@router.post("/registro", response_model=TokenResponse)
async def registro(data: RegistroRequest, db: AsyncSession = Depends(get_db)):
    existe = await db.execute(select(Usuario).where(Usuario.email == data.email))
    if existe.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    usuario = Usuario(
        nombre=data.nombre,
        email=data.email,
        telefono=data.telefono,
        password_hash=hash_password(data.password),
        rol=data.rol
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)

    token = crear_token({"sub": str(usuario.id), "rol": usuario.rol})
    return TokenResponse(access_token=token, rol=usuario.rol, nombre=usuario.nombre, id=usuario.id)

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.email == data.email))
    usuario = result.scalar_one_or_none()

    if not usuario or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Cuenta suspendida")

    usuario.ultimo_acceso = datetime.utcnow()
    await db.commit()

    token = crear_token({"sub": str(usuario.id), "rol": usuario.rol})
    return TokenResponse(access_token=token, rol=usuario.rol, nombre=usuario.nombre, id=usuario.id)

@router.get("/me")
async def mi_perfil(user: Usuario = Depends(get_current_user)):
    return {
        "id": user.id,
        "nombre": user.nombre,
        "email": user.email,
        "telefono": user.telefono,
        "foto_url": user.foto_url,
        "direccion": user.direccion if hasattr(user, 'direccion') else None,
        "rol": user.rol,
        "creado_en": user.creado_en,
    }

@router.patch("/perfil")
async def actualizar_perfil(
    data: PerfilUpdate,
    user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    for campo, valor in data.model_dump(exclude_none=True).items():
        if hasattr(user, campo):
            setattr(user, campo, valor)
    await db.commit()
    return {"mensaje": "Perfil actualizado"}
