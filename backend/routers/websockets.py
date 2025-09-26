from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import List, Dict

from backend.database import get_db
from backend.services.auth_service import get_current_user_from_query

router = APIRouter(
    tags=["WebSockets"],
)

class ConnectionManager:
    def __init__(self):
        # Almacena las conexiones activas: {audit_id: [websocket, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Almacena todas las conexiones activas
        self.all_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, audit_id: int = None):
        await websocket.accept()
        if audit_id:
            if audit_id not in self.active_connections:
                self.active_connections[audit_id] = []
            self.active_connections[audit_id].append(websocket)
        self.all_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, audit_id: int = None):
        if audit_id and audit_id in self.active_connections:
            self.active_connections[audit_id].remove(websocket)
        if websocket in self.all_connections:
            self.all_connections.remove(websocket)

    async def broadcast(self, message: str, audit_id: int):
        if audit_id in self.active_connections:
            for connection in self.active_connections[audit_id]:
                await connection.send_text(message)

    async def broadcast_to_all(self, message: str):
        for connection in self.all_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # Aquí se podría añadir una validación más robusta del usuario/token si fuera necesario
    await manager.connect(websocket)
    try:
        while True:
            # Mantenemos la conexión abierta para recibir y enviar mensajes
            data = await websocket.receive_text()
            # This part needs to be re-evaluated. For now, we just keep the connection open.
            # For a general websocket, we might not need to broadcast back the received message.
            # await manager.broadcast_to_all(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/ws/{audit_id}/{user_id}")
async def websocket_audit_endpoint(websocket: WebSocket, audit_id: int, user_id: int):
    # Aquí se podría añadir una validación más robusta del usuario/token si fuera necesario
    await manager.connect(websocket, audit_id)
    try:
        while True:
            # Mantenemos la conexión abierta para recibir y enviar mensajes
            data = await websocket.receive_text()
            # Por ahora, solo retransmitimos los mensajes a los demás en la misma auditoría
            await manager.broadcast(data, audit_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, audit_id)