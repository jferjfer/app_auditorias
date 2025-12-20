from dotenv import load_dotenv
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse

load_dotenv()

from backend.routers import auth, audits, users, websockets, collaboration, ubicaciones, products
from backend.database import engine
from backend import models
from backend.middleware.security import rate_limit_middleware
from backend.services.auth_service import get_current_user


# --- Configuracion de la Aplicacion ---
import os
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

app = FastAPI(
    title="API de Auditorías",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
    debug=DEBUG
)

# Middleware de seguridad pa proteger la app
app.middleware("http")(rate_limit_middleware)

# Hosts confiables (solo en produccion)
if not DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["app-auditorias.onrender.com", "*.onrender.com"]
    )

# CORS (solo origenes permitidos)
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Agregar dominio de produccion desde variable de entorno
production_url = os.getenv("PRODUCTION_URL")
if production_url:
    allowed_origins.append(production_url)
    # Tambien permitir sin www si tiene www
    if production_url.startswith("https://www."):
        allowed_origins.append(production_url.replace("https://www.", "https://"))
else:
    # Fallback: permitir cualquier subdominio de Render en produccion
    if not DEBUG:
        allowed_origins.append("https://app-auditorias.onrender.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600
)

# Encabezados de seguridad pa proteger contra ataques
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Incluir los routers de la API
app.include_router(auth.router, prefix="/api")
app.include_router(audits.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(websockets.router, prefix="/api")
app.include_router(collaboration.router, prefix="/api")
app.include_router(ubicaciones.router, prefix="/api")
app.include_router(products.router, prefix="/api")

# Proteger directorio uploads pa q solo usuarios autorizados accedan
@app.get("/uploads/{path:path}")
async def serve_upload(path: str, request: Request, current_user: models.User = Depends(get_current_user)):
    if current_user.rol not in ["auditor", "administrador", "analista"]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    file_path = f"uploads/{path}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)

# Servir el frontend de React solo en producción
if not DEBUG:
    frontend_dir = "frontend-app/dist"
    print(f"🔍 Buscando frontend en: {os.path.abspath(frontend_dir)}")
    print(f"📁 ¿Existe? {os.path.exists(frontend_dir)}")

    if os.path.exists(frontend_dir):
        print("✅ Frontend encontrado, montando archivos estáticos...")
        app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")
        app.mount("/images", StaticFiles(directory=os.path.join(frontend_dir, "images")), name="images")
        
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            print(f"📄 Solicitando: {full_path}")
            
            if full_path.startswith("api/") or full_path.startswith("uploads/"):
                raise HTTPException(status_code=404)
            
            # Si es la raíz o vacío, servir index.html
            if full_path == "" or full_path == "/":
                index_path = os.path.join(frontend_dir, "index.html")
                print(f"🏠 Sirviendo index: {index_path}")
                return FileResponse(index_path)
            
            file_path = os.path.join(frontend_dir, full_path)
            if os.path.isfile(file_path):
                print(f"📦 Sirviendo archivo: {file_path}")
                return FileResponse(file_path)
            
            # Para rutas de React Router, servir index.html
            index_path = os.path.join(frontend_dir, "index.html")
            if os.path.exists(index_path):
                print(f"🔄 Ruta SPA, sirviendo index: {index_path}")
                return FileResponse(index_path)
            
            raise HTTPException(status_code=404)
    else:
        print("❌ Frontend NO encontrado")
else:
    print("🔧 Modo desarrollo: Backend API solo (frontend por separado)")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)