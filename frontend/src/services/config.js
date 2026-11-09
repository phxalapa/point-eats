// URL base de la API.
// En Vercel el backend se publica en /api del mismo dominio (ver vercel.json).
// En desarrollo, vite.config.js redirige /api al backend local (127.0.0.1:8000).
// Se puede sobreescribir con VITE_API_URL si la API vive en otro dominio.
export const API_URL = import.meta.env.VITE_API_URL ?? '/api'
