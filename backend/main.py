from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Incluir los routers en la aplicación principal
app.include_router(auth.router)
app.include_router(audits.router)
app.include_router(users.router)
app.include_router(websockets.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)