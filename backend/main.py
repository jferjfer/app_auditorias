from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from backend.routers import auth, audits, users, websockets
from backend.database import engine
from backend import models


# --- Configuración de la Aplicación ---
app = FastAPI(title="API de Auditorías")

# Configuración de CORS (solo frontend permitido)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend local
        "http://127.0.0.1:3000",  # Alternativa local
        "https://app-auditorias.onrender.com", # URL del frontend desplegado
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Incluir los routers en la aplicación principal
app.include_router(auth.router, prefix="/api")
app.include_router(audits.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(websockets.router, prefix="/api")


# Servir el frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)