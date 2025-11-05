from dotenv import load_dotenv
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse

load_dotenv()

from backend.routers import auth, audits, users, websockets, collaboration
from backend.database import engine
from backend import models
from backend.middleware.security import rate_limit_middleware
from backend.services.auth_service import get_current_user


# --- Configuración de la Aplicación ---
import os
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

app = FastAPI(
    title="API de Auditorías",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
    debug=DEBUG
)

# Security middleware
app.middleware("http")(rate_limit_middleware)

# Trusted hosts (solo en producción)
if not DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["app-auditorias.onrender.com", "*.onrender.com"]
    )

# CORS (solo orígenes permitidos)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://app-auditorias.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600
)

# Security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Incluir los routers
app.include_router(auth.router, prefix="/api")
app.include_router(audits.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(websockets.router, prefix="/api")
app.include_router(collaboration.router, prefix="/api")


# Servir el frontend
frontend_dir = "frontend-app/dist" if os.path.exists("frontend-app/dist") else "frontend-app"
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

# Proteger directorio uploads
@app.get("/uploads/{path:path}")
async def serve_upload(path: str, request: Request, current_user: models.User = Depends(get_current_user)):
    """Servir archivos protegidos por autenticación"""
    if current_user.rol not in ["auditor", "administrador", "analista"]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    file_path = f"uploads/{path}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)