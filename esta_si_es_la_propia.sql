-- =====================================================
-- SCRIPT SQL: Base de Datos Sistema de Auditorías
-- Nombre: esta_si_es_la_propia.sql
-- Descripción: Esquema completo de la base de datos
-- =====================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    correo VARCHAR UNIQUE NOT NULL,
    contrasena_hash VARCHAR NOT NULL,
    rol VARCHAR NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);

-- Tabla de ubicaciones (sedes)
CREATE TABLE IF NOT EXISTS ubicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR UNIQUE NOT NULL,
    tipo VARCHAR NOT NULL DEFAULT 'sede',
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de auditorías
CREATE TABLE IF NOT EXISTS auditorias (
    id SERIAL PRIMARY KEY,
    auditor_id INTEGER REFERENCES usuarios(id),
    ubicacion_origen_id INTEGER REFERENCES ubicaciones(id),
    ubicacion_destino_id INTEGER REFERENCES ubicaciones(id),
    estado VARCHAR DEFAULT 'en_progreso',
    porcentaje_cumplimiento INTEGER,
    creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalizada_en TIMESTAMP,
    modo_auditoria VARCHAR DEFAULT 'normal'
);

-- Tabla de asociación para colaboradores de auditorías
CREATE TABLE IF NOT EXISTS audit_collaborators (
    user_id INTEGER REFERENCES usuarios(id),
    audit_id INTEGER REFERENCES auditorias(id),
    PRIMARY KEY (user_id, audit_id)
);

-- Tipo ENUM para novedades
DO $$ BEGIN
    CREATE TYPE novedad_enum AS ENUM (
        'sin_novedad',
        'sobrante',
        'faltante',
        'averia',
        'fecha_corta',
        'contaminado',
        'vencido'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de productos auditados
CREATE TABLE IF NOT EXISTS productos_auditados (
    id SERIAL PRIMARY KEY,
    auditoria_id INTEGER REFERENCES auditorias(id),
    sku VARCHAR NOT NULL,
    nombre_articulo VARCHAR NOT NULL,
    cantidad_documento INTEGER NOT NULL,
    cantidad_enviada INTEGER NOT NULL,
    cantidad_fisica INTEGER,
    novedad novedad_enum DEFAULT 'sin_novedad' NOT NULL,
    observaciones VARCHAR,
    orden_traslado_original VARCHAR,
    registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_by_user_id INTEGER REFERENCES usuarios(id),
    locked_at TIMESTAMP,
    last_modified_by_id INTEGER REFERENCES usuarios(id),
    last_modified_at TIMESTAMP
);

-- Tabla de novedades de productos (múltiples novedades por producto)
CREATE TABLE IF NOT EXISTS product_novelties (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES productos_auditados(id) ON DELETE CASCADE,
    novedad_tipo novedad_enum NOT NULL,
    cantidad INTEGER NOT NULL,
    observaciones VARCHAR,
    user_id INTEGER REFERENCES usuarios(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial de cambios en productos
CREATE TABLE IF NOT EXISTS product_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES productos_auditados(id),
    user_id INTEGER REFERENCES usuarios(id),
    field_changed VARCHAR NOT NULL,
    old_value VARCHAR,
    new_value VARCHAR,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de archivos de auditoría
CREATE TABLE IF NOT EXISTS archivos_auditoria (
    id SERIAL PRIMARY KEY,
    auditoria_id INTEGER REFERENCES auditorias(id),
    nombre_archivo VARCHAR NOT NULL,
    ruta_archivo VARCHAR NOT NULL,
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de informes generados
CREATE TABLE IF NOT EXISTS informes_generados (
    id SERIAL PRIMARY KEY,
    analista_id INTEGER REFERENCES usuarios(id),
    filtros_aplicados VARCHAR,
    ruta_archivo VARCHAR NOT NULL,
    generado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_auditorias_auditor ON auditorias(auditor_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_estado ON auditorias(estado);
CREATE INDEX IF NOT EXISTS idx_productos_auditoria ON productos_auditados(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos_auditados(sku);
CREATE INDEX IF NOT EXISTS idx_product_history_product ON product_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_novelties_product ON product_novelties(product_id);

-- Datos iniciales: Usuario administrador por defecto
-- Contraseña: admin123 (debe cambiarse en producción)
INSERT INTO usuarios (nombre, correo, contrasena_hash, rol)
VALUES ('Administrador', 'admin@sistema.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF6q0zPm', 'administrador')
ON CONFLICT (correo) DO NOTHING;

-- Datos iniciales: Sedes de ejemplo
INSERT INTO ubicaciones (nombre, tipo) VALUES
    ('Sede Principal', 'sede'),
    ('Bodega Norte', 'sede'),
    ('Bodega Sur', 'sede'),
    ('Centro Distribución', 'sede')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
