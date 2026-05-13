from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Point Eats"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./pointeats.db"
    SECRET_KEY: str = "point-eats-secret-key-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "dqge3npso"
    CLOUDINARY_API_KEY: str = "862492163555647"
    CLOUDINARY_API_SECRET: str = "IJyNBvDMcypUBvduqPSO2HluwoQ"

    class Config:
        env_file = ".env"

settings = Settings()