import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from websockets.exceptions import ConnectionClosed

from backend.database import get_db
from backend.services.auth_service import get_current_user_from_query

router = APIRouter(
    tags=["WebSockets"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
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

async def send_pings(websocket: WebSocket):
    """Sends a ping message every 20 seconds to keep the connection alive."""
    while True:
        await asyncio.sleep(20)
        try:
            await websocket.send_json({"type": "ping"})
        except (WebSocketDisconnect, ConnectionClosed):
            break

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket)
    ping_task = asyncio.create_task(send_pings(websocket))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        ping_task.cancel()

@router.websocket("/ws/{audit_id}/{user_id}")
async def websocket_audit_endpoint(websocket: WebSocket, audit_id: int, user_id: int):
    await manager.connect(websocket, audit_id)
    ping_task = asyncio.create_task(send_pings(websocket))
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data, audit_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, audit_id)
    finally:
        ping_task.cancel()
