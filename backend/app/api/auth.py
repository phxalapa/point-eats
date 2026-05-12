from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.core.database import get_db
from app.core.security import hash_password, verify_password, crear_token
from app.models.usuario import Usuario, RolUsuario

router = APIRouter(prefix="/auth", tags=["Autenticación"])

class RegistroRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: str = None
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
async def mi_perfil(db: AsyncSession = Depends(get_db)):
    return {"mensaje": "Ruta protegida próximamente"} 
