import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Dict
from websockets.exceptions import ConnectionClosed

from backend.database import SessionLocal
from backend.services.auth_service import get_user_from_token
from backend import models

async def send_pings(websocket: WebSocket):
    """Sends a ping message every 20 seconds to keep the connection alive."""
    while True:
        await asyncio.sleep(20)
        try:
            # The websockets library handles ping/pong frames automatically.
            # Sending a custom 'ping' message can help on the application level
            # and with some proxy/load balancer configurations.
            await websocket.send_text('{"type": "ping"}')
        except (WebSocketDisconnect, ConnectionClosed):
            # Connection is closed, stop the ping task
            break

router = APIRouter(
    tags=["WebSockets"],
)

class ConnectionManager:
    def __init__(self):
        # Connections for specific audit rooms
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Connections for general broadcast (all authenticated users)
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

@router.websocket("/ws")
async def websocket_general_endpoint(websocket: WebSocket, token: str = Query(...)):
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
                # Keep connection alive, can be used for duplex communication if needed
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        finally:
            ping_task.cancel()
    finally:
        db.close()

@router.websocket("/ws/{audit_id}")
async def websocket_audit_endpoint(websocket: WebSocket, audit_id: int, token: str = Query(...)):
    db = SessionLocal()
    try:
        user = get_user_from_token(db, token)
        if not user:
            await websocket.close(code=1008)
            return

        await manager.connect(websocket, audit_id)
        ping_task = asyncio.create_task(send_pings(websocket))
        try:
            while True:
                data = await websocket.receive_text()
                # For now, only broadcast. A more advanced implementation would check permissions.
                await manager.broadcast(data, audit_id)
        except WebSocketDisconnect:
            manager.disconnect(websocket, audit_id)
        finally:
            ping_task.cancel()
    finally:
        db.close()
