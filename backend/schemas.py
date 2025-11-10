from __future__ import annotations
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date, timezone
from zoneinfo import ZoneInfo


def datetime_to_bogota(dt: datetime):
    if dt is None:
        return None
    # If naive, assume it's stored as UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    bog = dt.astimezone(ZoneInfo("America/Bogota"))
    return bog.strftime("%Y-%m-%d %H:%M:%S")

# Esquema base para los usuarios
class UserBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str


class User(UserBase):  # ✅ Hereda nombre, correo, rol de UserBase
    id: int
    creado_en: Optional[datetime] = None  

    class Config:
        from_attributes = True
        json_encoders = {datetime: datetime_to_bogota}

# Esquema para crear un nuevo usuario
class UserCreate(UserBase):
    contrasena: str


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[EmailStr] = None
    rol: Optional[str] = None
    contrasena: Optional[str] = None




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
        from_attributes = True

# Esquema para el producto auditado CON ID (para respuestas)
class Product(ProductBase):
    id: int
    novelties: List[ProductNovelty] = [] # <--- AÑADIR ESTA LÍNEA
    
    class Config:
        from_attributes = True

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
        from_attributes = True
        json_encoders = {datetime: datetime_to_bogota}

# Esquema para mostrar los detalles de la auditoría con productos
class AuditDetails(Audit):
    productos: List[Product]
    collaborators: List[User] = []
    auditor: Optional[User] = None

    class Config:
        from_attributes = True
        json_encoders = {datetime: datetime_to_bogota}

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

    class Config:
        from_attributes = True
        json_encoders = {datetime: datetime_to_bogota}

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

class ProductNoveltyBase(BaseModel):
    novedad_tipo: str
    cantidad: int
    observaciones: Optional[str] = None

class ProductNoveltyCreate(ProductNoveltyBase):
    pass

class ProductNovelty(ProductNoveltyBase):
    id: int
    product_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {datetime: datetime_to_bogota}

# Esquema para actualizar un producto
class ProductUpdate(BaseModel):
    cantidad_fisica: Optional[int] = None
    novedad: Optional[str] = None
    observaciones: Optional[str] = None
    novelties: Optional[List[ProductNoveltyCreate]] = None

# Esquema para crear un producto (sin ID)
class ProductCreate(ProductBase):
    pass

    class Config:
        from_attributes = True

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
        from_attributes = True
        json_encoders = {datetime: datetime_to_bogota}

# Esquema para respuesta de login exitoso
class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

    class Config:
        from_attributes = True

# Esquema para respuesta de registro exitoso
class RegisterResponse(BaseModel):
    message: str
    user: User

    class Config:
        from_attributes = True

# Esquema para respuesta de carga de archivos
class FileUploadResponse(BaseModel):
    message: str
    audit_id: int
    productos_procesados: int
    numero_documento: str

    class Config:
        from_attributes = True

# Esquema para respuesta de actualización de producto
class ProductUpdateResponse(BaseModel):
    message: str
    product: Product

    class Config:
        from_attributes = True

# Esquema para respuesta de finalización de auditoría
class AuditFinishResponse(BaseModel):
    message: str
    audit: Audit
    porcentaje_cumplimiento: float

    class Config:
        from_attributes = True

# Esquema para añadir colaboradores a una auditoría
class CollaboratorUpdate(BaseModel):
    collaborator_ids: List[int]

class SurplusProductCreate(BaseModel):
    sku: str
    cantidad_fisica: int
    observaciones: Optional[str] = None

class ProductBulkUpdate(BaseModel):
    id: int
    cantidad_fisica: Optional[int] = None
    novedad: Optional[str] = None
    observaciones: Optional[str] = None

class ProductBulkUpdateRequest(BaseModel):
    products: List[ProductBulkUpdate]

# --- Esquemas para Estadísticas ---
class AuditStatusStatistic(BaseModel):
    estado: str
    count: int

class AverageComplianceStatistic(BaseModel):
    average_compliance: float

class NoveltyDistributionStatistic(BaseModel):
    novedad: str
    count: int

class ComplianceByAuditorStatistic(BaseModel):
    auditor_nombre: str
    average_compliance: float

class AuditsByPeriodStatistic(BaseModel):
    fecha: date
    total_auditorias: int

class TopNoveltySkuStatistic(BaseModel):
    sku: str
    nombre_articulo: str
    total_novedades: int

class AverageAuditDurationStatistic(BaseModel):
    average_duration_hours: float

class ProductHistory(BaseModel):
    id: int
    product_id: int
    user_id: int
    field_changed: str
    old_value: Optional[str]
    new_value: Optional[str]
    modified_at: datetime
    
    @property
    def user_name(self) -> str:
        return getattr(self, '_user_name', 'Unknown')
    
    class Config:
        from_attributes = True
        json_encoders = {datetime: datetime_to_bogota}
        
    @classmethod
    def from_orm(cls, obj):
        instance = super().from_orm(obj)
        if hasattr(obj, 'user') and obj.user:
            instance._user_name = obj.user.nombre
        return instance
class ProductWithNovelties(Product):
    novelties: List[ProductNovelty] = []
    
    class Config:
        from_attributes = True