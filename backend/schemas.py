from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Esquema base para los usuarios
class UserBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str


class User(UserBase):  # ✅ Hereda nombre, correo, rol de UserBase
    id: int
    creado_en: Optional[datetime] = None  

    class Config:
        orm_mode = True

# Esquema para crear un nuevo usuario
class UserCreate(UserBase):
    contrasena: str




# --- Esquemas para Auditorías ---
# Esquema base para el producto auditado
class ProductBase(BaseModel):
    sku: str
    nombre_articulo: str
    cantidad_documento: int
    cantidad_enviada: int
    cantidad_fisica: Optional[int] = None
    novedad: str
    observaciones: Optional[str] = None
    orden_traslado_original: str
    
    class Config:
        orm_mode = True

# Esquema para el producto auditado CON ID (para respuestas)
class Product(ProductBase):
    id: int
    
    class Config:
        orm_mode = True

# Esquema para crear una auditoría (con productos anidados)
class AuditCreate(BaseModel):
    ubicacion_destino: str
    productos: List[ProductBase]

# Esquema base para auditoría
class AuditBase(BaseModel):
    ubicacion_destino: str
    estado: str
    porcentaje_cumplimiento: Optional[int] = None

# Esquema para la respuesta de una auditoría
class Audit(AuditBase):
    id: int
    auditor_id: int
    creada_en: datetime
    auditor_nombre: Optional[str] = None
    
    class Config:
        orm_mode = True

# Esquema para mostrar los detalles de la auditoría con productos
class AuditDetails(Audit):
    productos: List[Product]

    class Config:
        orm_mode = True

# Esquema para la carga de archivos
class FileUpload(BaseModel):
    nombre_archivo: str
    ruta_archivo: str
    class Config:
        orm_mode = True

# Esquema para la respuesta de archivos
class File(FileUpload):
    id: int
    auditoria_id: int
    subido_en: datetime

    class Config:
        orm_mode = True

# Esquema de token JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    user_role: str
    user_id: int

# Esquema de datos de token
class TokenData(BaseModel):
    email: Optional[str] = None

# Esquema para actualizar un producto
class ProductUpdate(BaseModel):
    cantidad_fisica: Optional[int] = None
    novedad: Optional[str] = None
    observaciones: Optional[str] = None

# Esquema para crear un producto (sin ID)
class ProductCreate(ProductBase):
    pass

    class Config:
        orm_mode = True

# Esquema para respuesta de auditorías con información básica
class AuditResponse(BaseModel):
    id: int
    ubicacion_destino: str
    auditor_id: int
    auditor_nombre: Optional[str] = None
    creada_en: datetime
    estado: str
    porcentaje_cumplimiento: Optional[int] = None
    productos_count: Optional[int] = None

    class Config:
        orm_mode = True # Ya estaba correcto, pero lo confirmo

# Esquema para respuesta de login exitoso
class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

    class Config:
        orm_mode = True # Ya estaba correcto

# Esquema para respuesta de registro exitoso
class RegisterResponse(BaseModel):
    message: str
    user: User

    class Config:
        orm_mode = True # Ya estaba correcto

# Esquema para respuesta de carga de archivos
class FileUploadResponse(BaseModel):
    message: str
    audit_id: int
    productos_procesados: int
    numero_documento: str

    class Config:
        orm_mode = True # Ya estaba correcto

# Esquema para respuesta de actualización de producto
class ProductUpdateResponse(BaseModel):
    message: str
    product: Product

    class Config:
        orm_mode = True # Ya estaba correcto

# Esquema para respuesta de finalización de auditoría
class AuditFinishResponse(BaseModel):
    message: str
    audit: Audit
    porcentaje_cumplimiento: float

    class Config:
        orm_mode = True # Ya estaba correcto

# Esquema para añadir colaboradores a una auditoría
class CollaboratorUpdate(BaseModel):
    collaborator_ids: List[int]