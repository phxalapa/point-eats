from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import auth, restaurantes, pedidos, chat, media, promociones, admin

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="API principal de Point Eats"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(restaurantes.router)
app.include_router(pedidos.router)
app.include_router(chat.router)
app.include_router(media.router)
app.include_router(promociones.router)
app.include_router(admin.router)

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": settings.VERSION, "status": "funcionando"}

@app.get("/health")
async def health():
    return {"status": "ok"}