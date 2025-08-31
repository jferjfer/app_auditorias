from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Esquema base para los usuarios
class UserBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str

# Esquema para crear un nuevo usuario
class UserCreate(UserBase):
    contrasena: str

# Esquema para la respuesta de la API (no mostrará la contraseña)
class User(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- Esquemas para Auditorías ---
# Esquema para el producto auditado (para usar dentro de AuditCreate)
class ProductBase(BaseModel):
    sku: str
    nombre_articulo: str
    cantidad_documento: int
    cantidad_enviada: int
    cantidad_fisica: Optional[int] = None
    novedad: str
    observaciones: Optional[str] = None
    orden_traslado_original: str
    
    # Esta es la parte que soluciona el error
    class Config:
        from_attributes = True
    
# Esquema para crear una auditoría (con productos anidados)
class AuditCreate(BaseModel):
    ubicacion_destino: str
    productos: List[ProductBase]

# Esquema para la respuesta de una auditoría
class Audit(BaseModel):
    id: int
    ubicacion_destino: str
    auditor_id: int
    creada_en: datetime
    estado: str
    porcentaje_cumplimiento: Optional[int]
    
    class Config:
        from_attributes = True

# Esquema para mostrar los detalles de la auditoría con productos
class AuditDetails(Audit):
    productos: List[ProductBase]

    class Config:
        from_attributes = True

# Esquema para la carga de archivos
class FileUpload(BaseModel):
    nombre_archivo: str
    ruta_archivo: str

    class Config:
        from_attributes = True

# Esquema para la respuesta de archivos
class File(FileUpload):
    id: int
    auditoria_id: int
    subido_en: datetime

# Esquema de token JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    user_role: str

# Esquema de datos de token
class TokenData(BaseModel):
    email: Optional[str] = None

# Esquema para actualizar un producto
class ProductUpdate(BaseModel):
    cantidad_fisica: Optional[int] = None
    novedad: Optional[str] = None
    observaciones: Optional[str] = None