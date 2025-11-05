import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict
from websockets.exceptions import ConnectionClosed

from backend.database import SessionLocal
from backend.services.auth_service import get_user_from_token

# --- Funciones de WebSocket ---

async def send_pings(websocket: WebSocket):
    """Envía un mensaje ping cada 20 segundos para mantener la conexión activa."""
    while True:
        await asyncio.sleep(20)
        try:
            await websocket.send_text(json.dumps({"type": "ping"}))
        except (WebSocketDisconnect, ConnectionClosed, RuntimeError):
            # La conexión está cerrada, se detiene la tarea de ping.
            break

router = APIRouter(
    tags=["WebSockets"],
)

class ConnectionManager:
    def __init__(self):
        # Conexiones para salas de auditoría específicas
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Conexiones para difusión general (todos los usuarios autenticados)
        self.all_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, audit_id: int = None):
        await websocket.accept()
        if audit_id:
            if audit_id not in self.active_connections:
                self.active_connections[audit_id] = []
            self.active_connections[audit_id].append(websocket)
        else:
            self.all_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, audit_id: int = None):
        if audit_id and audit_id in self.active_connections:
            if websocket in self.active_connections[audit_id]:
                self.active_connections[audit_id].remove(websocket)
        if websocket in self.all_connections:
            self.all_connections.remove(websocket)

    async def broadcast(self, message: str, audit_id: int):
        """Envía un mensaje a todos los clientes en una sala de auditoría específica."""
        if audit_id in self.active_connections:
            # Iterar sobre una copia para poder modificar la lista si hay desconexiones
            for connection in list(self.active_connections[audit_id]):
                try:
                    await connection.send_text(message)
                except (WebSocketDisconnect, ConnectionClosed, RuntimeError):
                    self.disconnect(connection, audit_id)
    
    async def send_to_audit(self, audit_id: int, data: dict):
        """Envía evento estructurado a una auditoría específica."""
        message = json.dumps(data, default=str)
        await self.broadcast(message, audit_id)

    async def broadcast_to_all(self, message: str):
        """Envía un mensaje a todos los clientes conectados."""
        # Iterar sobre una copia para poder modificar la lista si hay desconexiones
        for connection in list(self.all_connections):
            try:
                await connection.send_text(message)
            except (WebSocketDisconnect, ConnectionClosed, RuntimeError):
                self.disconnect(connection)

manager = ConnectionManager()

# --- Endpoints de WebSocket ---

@router.websocket("/ws")
async def websocket_general_endpoint(websocket: WebSocket, token: str = Query(...)):
    """Endpoint de WebSocket para notificaciones generales (ej. nueva auditoría)."""
    db = SessionLocal()
    try:
        user = get_user_from_token(db, token)
        if not user:
            await websocket.close(code=1008)
            return
        
        await manager.connect(websocket)
        ping_task = asyncio.create_task(send_pings(websocket))
        try:
            while True:
                # Mantiene la conexión viva. Puede recibir mensajes si es necesario.
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        finally:
            ping_task.cancel()
    finally:
        db.close()

@router.websocket("/ws/{audit_id}")
async def websocket_audit_endpoint(websocket: WebSocket, audit_id: int, token: str = Query(...)):
    """Endpoint de WebSocket para una auditoría específica."""
    db = SessionLocal()
    try:
        user = get_user_from_token(db, token)
        if not user:
            await websocket.close(code=1008)
            return
        
        # Validar acceso a la auditoría
        from backend import crud
        audit = crud.get_audit_by_id(db, audit_id)
        if not audit:
            await websocket.close(code=1008)
            return
        
        # Verificar permisos
        is_owner = audit.auditor_id == user.id
        is_collaborator = user in audit.collaborators
        is_admin = user.rol in ["administrador", "analista"]
        
        if not (is_owner or is_collaborator or is_admin):
            await websocket.close(code=1008)
            return

        await manager.connect(websocket, audit_id)
        ping_task = asyncio.create_task(send_pings(websocket))
        try:
            while True:
                # Por ahora, solo se reciben datos para mantener la conexión.
                # La lógica de broadcast se maneja desde los endpoints HTTP.
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, audit_id)
        finally:
            ping_task.cancel()
    finally:
        db.close()