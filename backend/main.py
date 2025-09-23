from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# --- INICIO: Lógica de Migración Automática ---
import subprocess
# --- FIN: Lógica de Migración Automática ---

from backend.routers import auth, audits, users, websockets
from backend.database import engine
from backend import models


# --- Configuración de la Aplicación ---
app = FastAPI(title="API de Auditorías")

# --- INICIO: Lógica de Migración Automática ---
@app.on_event("startup")
def run_migrations():
    try:
        print("Ejecutando migraciones de base de datos...")
        # Se usa subprocess para evitar problemas de concurrencia con el ORM
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        print("Migraciones completadas con éxito.")
    except subprocess.CalledProcessError as e:
        print("---!! ERROR DURANTE LA MIGRACIÓN DE ALEMBIC !! ---")
        print(f"---!! STDOUT: !! ---
{e.stdout}")
        print(f"---!! STDERR: !! ---
{e.stderr}")
        print("---!! FIN DEL ERROR DE MIGRACIÓN !! ---")
        # Opcional: decidir si la app debe fallar si las migraciones no se aplican
        # raise e 
    except FileNotFoundError:
        print("Comando 'alembic' no encontrado. Asegúrate de que esté en el PATH.")
        # raise
# --- FIN: Lógica de Migración Automática ---


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