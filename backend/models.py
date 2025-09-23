import uuid
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

# --- Tabla de Asociación para Auditorías Colaborativas ---
audit_collaborators = Table(
    'audit_collaborators',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('usuarios.id'), primary_key=True),
    Column('audit_id', Integer, ForeignKey('auditorias.id'), primary_key=True)
)

# La tabla "usuarios" del script SQL
class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    contrasena_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

    # Auditorías donde el usuario es el principal
    auditorias = relationship("Audit", back_populates="auditor", foreign_keys='Audit.auditor_id')
    
    # Auditorías en las que el usuario colabora
    collaborative_audits = relationship(
        "Audit",
        secondary=audit_collaborators,
        back_populates="collaborators"
    )
    
    informes_generados = relationship("Report", back_populates="analista")

# La tabla "auditorias" del script SQL
class Audit(Base):
    __tablename__ = "auditorias"

    id = Column(Integer, primary_key=True)
    auditor_id = Column(Integer, ForeignKey("usuarios.id"))
    ubicacion_destino = Column(String, nullable=False)
    estado = Column(String, default="en_progreso")
    porcentaje_cumplimiento = Column(Integer)
    creada_en = Column(DateTime, default=datetime.utcnow)

    # Auditor principal
    auditor = relationship("User", back_populates="auditorias", foreign_keys=[auditor_id])
    
    # Colaboradores de la auditoría
    collaborators = relationship(
        "User",
        secondary=audit_collaborators,
        back_populates="collaborative_audits"
    )
    
    productos = relationship("Product", back_populates="auditoria")
    archivos = relationship("File", back_populates="auditoria")

# La tabla "productos_auditados" del script SQL
class Product(Base):
    __tablename__ = "productos_auditados"

    id = Column(Integer, primary_key=True)
    auditoria_id = Column(Integer, ForeignKey("auditorias.id"))
    sku = Column(String, nullable=False)
    nombre_articulo = Column(String, nullable=False)
    cantidad_documento = Column(Integer, nullable=False)
    cantidad_enviada = Column(Integer, nullable=False)
    cantidad_fisica = Column(Integer)
    novedad = Column(String, default="sin_novedad")
    observaciones = Column(String, nullable=True)
    orden_traslado_original = Column(String)
    registrado_en = Column(DateTime, default=datetime.utcnow)

    auditoria = relationship("Audit", back_populates="productos")

# La tabla "archivos_auditoria" del script SQL
class File(Base):
    __tablename__ = "archivos_auditoria"

    id = Column(Integer, primary_key=True)
    auditoria_id = Column(Integer, ForeignKey("auditorias.id"))
    nombre_archivo = Column(String, nullable=False)
    ruta_archivo = Column(String, nullable=False)
    subido_en = Column(DateTime, default=datetime.utcnow)

    auditoria = relationship("Audit", back_populates="archivos")

# La tabla "informes_generados" del script SQL
class Report(Base):
    __tablename__ = "informes_generados"

    id = Column(Integer, primary_key=True)
    analista_id = Column(Integer, ForeignKey("usuarios.id"))
    filtros_aplicados = Column(String)
    ruta_archivo = Column(String, nullable=False)
    generado_en = Column(DateTime, default=datetime.utcnow)

    analista = relationship("User", back_populates="informes_generados")