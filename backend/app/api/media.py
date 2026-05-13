from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import cloudinary
import cloudinary.uploader
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import require_rol
from app.models.usuario import Usuario, RolUsuario
from app.models.restaurante import Restaurante

router = APIRouter(prefix="/media", tags=["Media"])

# Configurar Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

@router.post("/subir-imagen")
async def subir_imagen(
    file: UploadFile = File(...),
    carpeta: str = Form("pointeats"),
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    # Verificar tipo de archivo
    tipos_permitidos = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in tipos_permitidos:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, PNG, WEBP o GIF")

    # Verificar tamaño máximo 5MB
    contenido = await file.read()
    if len(contenido) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede pesar más de 5MB")

    try:
        # Subir a Cloudinary
        resultado = cloudinary.uploader.upload(
            contenido,
            folder=f"pointeats/{carpeta}",
            transformation=[
                {"width": 800, "height": 800, "crop": "limit"},
                {"quality": "auto"},
                {"fetch_format": "auto"}
            ]
        )
        return {
            "url": resultado["secure_url"],
            "public_id": resultado["public_id"],
            "width": resultado.get("width"),
            "height": resultado.get("height")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")


@router.post("/subir-video")
async def subir_video(
    file: UploadFile = File(...),
    user: Usuario = Depends(require_rol(RolUsuario.restaurante)),
    db: AsyncSession = Depends(get_db)
):
    tipos_permitidos = ["video/mp4", "video/quicktime", "video/webm"]
    if file.content_type not in tipos_permitidos:
        raise HTTPException(status_code=400, detail="Solo se permiten videos MP4, MOV o WEBM")

    contenido = await file.read()
    # Máximo 50MB para videos
    if len(contenido) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El video no puede pesar más de 50MB")

    try:
        resultado = cloudinary.uploader.upload(
            contenido,
            resource_type="video",
            folder="pointeats/videos",
            transformation=[
                {"duration": 30},  # Máximo 30 segundos
                {"quality": "auto"}
            ]
        )
        return {
            "url": resultado["secure_url"],
            "public_id": resultado["public_id"],
            "duracion": resultado.get("duration")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir video: {str(e)}")


@router.delete("/eliminar/{public_id:path}")
async def eliminar_media(
    public_id: str,
    user: Usuario = Depends(require_rol(RolUsuario.restaurante))
):
    try:
        cloudinary.uploader.destroy(public_id)
        return {"mensaje": "Archivo eliminado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
