import uuid
import enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Table, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

# --- Tabla de Asociacion pa Auditorias Colaborativas ---
audit_collaborators = Table(
    'audit_collaborators',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('usuarios.id'), primary_key=True),
    Column('audit_id', Integer, ForeignKey('auditorias.id'), primary_key=True)
)

# La tabla "usuarios" del script SQL
class User(Base):
    """Modelo de usuario del sistema con roles de auditor, analista o administrador"""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    contrasena_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

    # Auditorias donde el usuario es el principal
    auditorias = relationship("Audit", back_populates="auditor", foreign_keys='Audit.auditor_id')
    
    # Auditorias en las q el usuario colabora
    collaborative_audits = relationship(
        "Audit",
        secondary=audit_collaborators,
        back_populates="collaborators"
    )
    
    informes_generados = relationship("Report", back_populates="analista")

# Tabla de sedes y ubicaciones
class Ubicacion(Base):
    """Modelo de ubicaciones (sedes, bodegas, centros de distribucion)"""
    __tablename__ = "ubicaciones"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False, unique=True)
    tipo = Column(String, nullable=False, default='sede')  # Siempre 'sede'
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

    creador = relationship("User")
    auditorias_origen = relationship("Audit", back_populates="ubicacion_origen", foreign_keys='Audit.ubicacion_origen_id')
    auditorias_destino = relationship("Audit", back_populates="ubicacion_destino", foreign_keys='Audit.ubicacion_destino_id')

# La tabla "auditorias" del script SQL
class Audit(Base):
    """Modelo de auditoria con soporte pa modo normal y conteo rapido"""
    __tablename__ = "auditorias"

    id = Column(Integer, primary_key=True)
    auditor_id = Column(Integer, ForeignKey("usuarios.id"))
    ubicacion_origen_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=True)
    ubicacion_destino_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=True)
    estado = Column(String, default="en_progreso")
    porcentaje_cumplimiento = Column(Integer)
    creada_en = Column(DateTime, default=datetime.utcnow)
    finalizada_en = Column(DateTime, nullable=True)
    modo_auditoria = Column(String, default="normal")

    # Auditor principal
    auditor = relationship("User", back_populates="auditorias", foreign_keys=[auditor_id])
    
    # Ubicaciones de origen y destino
    ubicacion_origen = relationship("Ubicacion", back_populates="auditorias_origen", foreign_keys=[ubicacion_origen_id])
    ubicacion_destino = relationship("Ubicacion", back_populates="auditorias_destino", foreign_keys=[ubicacion_destino_id])
    
    # Colaboradores de la auditoria
    collaborators = relationship(
        "User",
        secondary=audit_collaborators,
        back_populates="collaborative_audits"
    )
    
    productos = relationship("Product", back_populates="auditoria")
    archivos = relationship("File", back_populates="auditoria")
    
    __table_args__ = (
        Index('idx_auditorias_auditor', 'auditor_id'),
        Index('idx_auditorias_fecha', 'creada_en'),
        Index('idx_auditorias_estado', 'estado'),
    )

# La tabla "productos_auditados" del script SQL
class NovedadEnum(str, enum.Enum):
    """Tipos de novedades q pueden tener los productos"""
    sin_novedad = "sin_novedad"
    sobrante = "sobrante"
    faltante = "faltante"
    averia = "averia"
    fecha_corta = "fecha_corta"
    contaminado = "contaminado"
    vencido = "vencido"
    no_salio = "no_salio"

class Product(Base):
    """Modelo de producto auditado con soporte pa colaboracion en tiempo real"""
    __tablename__ = "productos_auditados"

    id = Column(Integer, primary_key=True)
    auditoria_id = Column(Integer, ForeignKey("auditorias.id"))
    sku = Column(String, nullable=False)
    nombre_articulo = Column(String, nullable=False)
    cantidad_documento = Column(Integer, nullable=False)
    cantidad_enviada = Column(Integer, nullable=False)
    cantidad_fisica = Column(Integer)
    novedad = Column(Enum(NovedadEnum), default=NovedadEnum.sin_novedad, nullable=False)
    observaciones = Column(String, nullable=True)
    orden_traslado_original = Column(String)
    registrado_en = Column(DateTime, default=datetime.utcnow)
    
    # Campos pa colaboracion en tiempo real
    locked_by_user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    locked_at = Column(DateTime, nullable=True)
    last_modified_by_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    last_modified_at = Column(DateTime, nullable=True)

    auditoria = relationship("Audit", back_populates="productos")
    locked_by = relationship("User", foreign_keys=[locked_by_user_id])
    last_modified_by = relationship("User", foreign_keys=[last_modified_by_id])
    novelties = relationship("ProductNovelty", back_populates="product", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_productos_auditoria', 'auditoria_id'),
        Index('idx_productos_sku', 'sku'),
        Index('idx_productos_novedad', 'novedad'),
    )

# La tabla "archivos_auditoria" del script SQL
class File(Base):
    """Modelo de archivos Excel subidos pa las auditorias"""
    __tablename__ = "archivos_auditoria"

    id = Column(Integer, primary_key=True)
    auditoria_id = Column(Integer, ForeignKey("auditorias.id"))
    nombre_archivo = Column(String, nullable=False)
    ruta_archivo = Column(String, nullable=False)
    subido_en = Column(DateTime, default=datetime.utcnow)

    auditoria = relationship("Audit", back_populates="archivos")

# La tabla "informes_generados" del script SQL
class Report(Base):
    """Modelo de informes generados por los analistas"""
    __tablename__ = "informes_generados"

    id = Column(Integer, primary_key=True)
    analista_id = Column(Integer, ForeignKey("usuarios.id"))
    filtros_aplicados = Column(String)
    ruta_archivo = Column(String, nullable=False)
    generado_en = Column(DateTime, default=datetime.utcnow)

    analista = relationship("User", back_populates="informes_generados")

class ProductHistory(Base):
    """Historial de cambios en productos pa auditoria colaborativa"""
    __tablename__ = "product_history"
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("productos_auditados.id"))
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    field_changed = Column(String, nullable=False)
    old_value = Column(String)
    new_value = Column(String)
    modified_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product")
    user = relationship("User")

class ProductNovelty(Base):
    """Novedades multiples por producto (averias, vencidos, etc)"""
    __tablename__ = "product_novelties"
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("productos_auditados.id"), nullable=False)
    novedad_tipo = Column(Enum(NovedadEnum), nullable=False)
    cantidad = Column(Integer, nullable=False)
    observaciones = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="novelties")
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_novelties_product', 'product_id'),
        Index('idx_novelties_tipo', 'novedad_tipo'),
    )