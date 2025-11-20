# 🏢 Sistema de Auditorías - Documentación Completa para Manual de Funciones

## 📋 ÍNDICE GENERAL

1. [Información del Sistema](#información-del-sistema)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Roles y Permisos Detallados](#roles-y-permisos-detallados)
4. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
5. [API Endpoints](#api-endpoints)
6. [Base de Datos](#base-de-datos)
7. [Flujos de Trabajo](#flujos-de-trabajo)
8. [Características Técnicas](#características-técnicas)
9. [Seguridad](#seguridad)
10. [Instalación y Despliegue](#instalación-y-despliegue)

---

## 🎯 INFORMACIÓN DEL SISTEMA

### Descripción General
Sistema completo para la gestión de auditorías de inventario con carga de archivos Excel, escaneo de productos en tiempo real, dashboards analíticos y despliegue en la nube.

### URLs de Acceso
- **Producción**: https://app-auditorias.onrender.com
- **Desarrollo Local**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/docs (solo desarrollo)

### Versión Actual
- **Sistema**: NEMESIS V1
- **Versión Backend**: FastAPI + SQLAlchemy
- **Versión Frontend**: React 18 + Bootstrap 5
- **Base de Datos**: PostgreSQL (producción) / SQLite (desarrollo)

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico

#### Backend (FastAPI)
```
backend/
├── main.py                 # Aplicación principal FastAPI
├── models.py              # Modelos SQLAlchemy (Base de datos)
├── schemas.py             # Esquemas Pydantic (Validación)
├── crud.py                # Operaciones CRUD
├── database.py            # Configuración de BD
├── dependencies.py        # Dependencias compartidas
├── middleware/            # Middleware de seguridad
│   ├── security.py        # Rate limiting
│   └── csrf.py           # Protección CSRF
├── routers/              # Endpoints API
│   ├── auth.py           # Autenticación JWT
│   ├── audits.py         # Gestión de auditorías
│   ├── users.py          # Gestión de usuarios
│   ├── websockets.py     # WebSockets tiempo real
│   ├── collaboration.py  # Colaboración en tiempo real
│   └── ubicaciones.py    # Gestión de sedes
├── services/             # Servicios de negocio
│   └── auth_service.py   # Servicio de autenticación
└── utils/               # Utilidades
    └── validators.py     # Validadores de seguridad
```

#### Frontend (React)
```
frontend-app/src/
├── App.jsx               # Componente principal
├── main.jsx             # Punto de entrada
├── pages/               # Páginas principales
│   ├── Login.jsx        # Página de login
│   ├── AuditorDashboard.jsx    # Dashboard auditor
│   ├── AnalystDashboard.jsx    # Dashboard analista
│   ├── AdminDashboard.jsx      # Dashboard admin
│   └── Scanner.jsx      # Página de escaneo
├── components/          # Componentes reutilizables
│   ├── Sidebar.jsx      # Barra lateral navegación
│   ├── Topbar.jsx       # Barra superior
│   ├── ThemeSwitcher.jsx # Selector de temas
│   ├── Toast.jsx        # Notificaciones
│   ├── ConfirmModal.jsx # Modal de confirmación
│   ├── CollaboratorModal.jsx # Modal colaboradores
│   ├── CameraScanner.jsx # Escáner con cámara
│   ├── AuditHistory.jsx # Historial de cambios
│   ├── NovedadModal.jsx # Modal de novedades
│   ├── AddOtModal.jsx   # Modal agregar OT
│   ├── UbicacionesManager.jsx # Gestión sedes
│   └── AnalystDashboard/
│       ├── AnalystDashboard.jsx # Dashboard principal
│       ├── Filters.jsx  # Filtros de búsqueda
│       ├── KPIs.jsx     # Indicadores clave
│       ├── Charts.jsx   # Gráficos estadísticos
│       └── AuditProductsModal.jsx # Modal productos
├── services/            # Servicios API
│   ├── api.js          # Cliente API REST
│   └── auth.js         # Servicio autenticación
├── hooks/              # Hooks personalizados
│   ├── useOfflineSync.js # Sincronización offline
│   ├── useSessionKeepAlive.js # Mantener sesión
│   └── useStats.js     # Hook estadísticas
├── utils/              # Utilidades
│   ├── offlineDB.js    # Base datos offline (IndexedDB)
│   └── pdfGenerator.js # Generador de PDFs
└── styles/             # Estilos CSS
    ├── style.css       # Estilos principales
    ├── themes.css      # 7 temas de color
    ├── mobile.css      # Estilos móviles
    └── force-fullwidth.css # Estilos pantalla completa
```

### Base de Datos (PostgreSQL)

#### Tablas Principales
```sql
-- Usuarios del sistema
usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    correo VARCHAR UNIQUE NOT NULL,
    contrasena_hash VARCHAR NOT NULL,
    rol VARCHAR NOT NULL, -- 'auditor', 'analista', 'administrador'
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Ubicaciones/Sedes
ubicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR UNIQUE NOT NULL,
    tipo VARCHAR DEFAULT 'sede',
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Auditorías
auditorias (
    id SERIAL PRIMARY KEY,
    auditor_id INTEGER REFERENCES usuarios(id),
    ubicacion_origen_id INTEGER REFERENCES ubicaciones(id),
    ubicacion_destino_id INTEGER REFERENCES ubicaciones(id),
    estado VARCHAR DEFAULT 'pendiente', -- 'pendiente', 'en_progreso', 'finalizada'
    porcentaje_cumplimiento INTEGER,
    creada_en TIMESTAMP DEFAULT NOW(),
    finalizada_en TIMESTAMP
);

-- Productos auditados
productos_auditados (
    id SERIAL PRIMARY KEY,
    auditoria_id INTEGER REFERENCES auditorias(id),
    sku VARCHAR NOT NULL,
    nombre_articulo VARCHAR NOT NULL,
    cantidad_documento INTEGER NOT NULL,
    cantidad_enviada INTEGER NOT NULL,
    cantidad_fisica INTEGER,
    novedad VARCHAR DEFAULT 'sin_novedad', -- 'sin_novedad', 'faltante', 'sobrante', 'averia', etc.
    observaciones TEXT,
    orden_traslado_original VARCHAR,
    registrado_en TIMESTAMP DEFAULT NOW(),
    -- Campos colaboración
    locked_by_user_id INTEGER REFERENCES usuarios(id),
    locked_at TIMESTAMP,
    last_modified_by_id INTEGER REFERENCES usuarios(id),
    last_modified_at TIMESTAMP
);

-- Colaboradores de auditorías (Many-to-Many)
audit_collaborators (
    user_id INTEGER REFERENCES usuarios(id),
    audit_id INTEGER REFERENCES auditorias(id),
    PRIMARY KEY (user_id, audit_id)
);

-- Historial de cambios
product_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES productos_auditados(id),
    user_id INTEGER REFERENCES usuarios(id),
    field_changed VARCHAR NOT NULL,
    old_value VARCHAR,
    new_value VARCHAR,
    modified_at TIMESTAMP DEFAULT NOW()
);

-- Novedades detalladas por producto
product_novelties (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES productos_auditados(id),
    novedad_tipo VARCHAR NOT NULL,
    cantidad INTEGER NOT NULL,
    observaciones TEXT,
    user_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Archivos de auditoría
archivos_auditoria (
    id SERIAL PRIMARY KEY,
    auditoria_id INTEGER REFERENCES auditorias(id),
    nombre_archivo VARCHAR NOT NULL,
    ruta_archivo VARCHAR NOT NULL,
    subido_en TIMESTAMP DEFAULT NOW()
);

-- Informes generados
informes_generados (
    id SERIAL PRIMARY KEY,
    analista_id INTEGER REFERENCES usuarios(id),
    filtros_aplicados TEXT,
    ruta_archivo VARCHAR NOT NULL,
    generado_en TIMESTAMP DEFAULT NOW()
);
```

---

## 👥 ROLES Y PERMISOS DETALLADOS

### 🔍 ROL: AUDITOR

#### Permisos de Auditorías
- ✅ Crear auditorías (carga de archivos Excel)
- ✅ Ver sus propias auditorías
- ✅ Ver auditorías donde es colaborador
- ✅ Iniciar auditorías (cambiar estado pendiente → en_progreso)
- ✅ Agregar colaboradores a sus auditorías
- ✅ Editar productos de auditorías activas
- ✅ Finalizar auditorías (cambiar estado → finalizada)
- ✅ Ver historial de cambios de sus auditorías
- ❌ Ver auditorías de otros auditores (excepto como colaborador)
- ❌ Eliminar auditorías
- ❌ Modificar auditorías finalizadas

#### Permisos de Productos
- ✅ Escanear productos (teclado/cámara)
- ✅ Actualizar cantidad física
- ✅ Registrar novedades (faltante, sobrante, avería, etc.)
- ✅ Agregar observaciones
- ✅ Crear productos sobrantes
- ✅ Bloquear/desbloquear productos durante edición
- ✅ Ver novedades por SKU
- ❌ Eliminar productos

#### Permisos de Colaboración
- ✅ Agregar colaboradores a auditorías propias
- ✅ Trabajar en tiempo real con otros auditores
- ✅ Ver notificaciones de cambios
- ✅ Ver quién está editando qué producto
- ❌ Remover colaboradores

#### Permisos de Archivos
- ✅ Subir archivos Excel (.xlsx, .xls)
- ✅ Agregar OTs adicionales a auditorías existentes
- ✅ Ver archivos de sus auditorías
- ❌ Eliminar archivos

### 📊 ROL: ANALISTA

#### Permisos de Visualización
- ✅ Ver todas las auditorías del sistema
- ✅ Ver detalles completos de cualquier auditoría
- ✅ Ver productos de todas las auditorías
- ✅ Ver estadísticas globales
- ✅ Buscar auditorías por OT
- ❌ Crear auditorías
- ❌ Editar productos
- ❌ Finalizar auditorías

#### Permisos de Reportes
- ✅ Generar reportes en Excel
- ✅ Generar reportes en PDF
- ✅ Filtrar datos por múltiples criterios
- ✅ Exportar estadísticas
- ✅ Ver gráficos y KPIs
- ❌ Modificar datos

#### Permisos de Filtros
- ✅ Filtrar por estado de auditoría
- ✅ Filtrar por auditor
- ✅ Filtrar por rango de fechas
- ✅ Filtrar por ubicación
- ✅ Buscar por texto libre

### ⚙️ ROL: ADMINISTRADOR

#### Permisos de Usuario
- ✅ Ver todos los usuarios
- ✅ Crear nuevos usuarios
- ✅ Editar usuarios existentes
- ✅ Eliminar usuarios
- ✅ Cambiar roles de usuarios
- ✅ Resetear contraseñas

#### Permisos de Sistema
- ✅ Todos los permisos de Auditor
- ✅ Todos los permisos de Analista
- ✅ Ver auditorías de todos los usuarios
- ✅ Finalizar cualquier auditoría
- ✅ Supervisar colaboraciones
- ✅ Gestionar ubicaciones/sedes

#### Permisos de Configuración
- ✅ Crear/editar/eliminar ubicaciones
- ✅ Ver logs del sistema
- ✅ Configurar parámetros globales
- ✅ Acceso a métricas de rendimiento

---

## 🔧 FUNCIONALIDADES POR MÓDULO

### MÓDULO AUDITOR (AuditorDashboard.jsx)

#### 1. Carga de Archivos Excel
**Función**: `handleUpload()`
**Endpoint**: `POST /api/audits/upload-multiple-files`
**Características**:
- Soporte múltiples archivos simultáneos
- Validación automática de formato Excel
- Detección inteligente de columnas (flexible)
- Procesamiento de múltiples OTs en un solo archivo
- Creación automática de auditoría con productos
- Selección de ubicación origen y destino

**Flujo**:
1. Usuario selecciona archivos .xlsx/.xls
2. Selecciona ubicación origen y destino
3. Sistema valida archivos (tamaño, formato, contenido)
4. Procesa cada archivo buscando columnas requeridas
5. Extrae productos y crea auditoría
6. Retorna ID de auditoría y resumen de productos

#### 2. Gestión de Auditorías
**Funciones**: `handleIniciar()`, `handleVerAuditoria()`, `handleFinish()`
**Estados**: pendiente → en_progreso → finalizada

**Iniciar Auditoría**:
- Cambia estado de 'pendiente' a 'en_progreso'
- Habilita edición de productos
- Permite agregar colaboradores

**Ver Auditoría**:
- Carga productos de la auditoría
- Construye índice de SKUs para búsqueda rápida
- Inicializa WebSocket para colaboración
- Soporte offline con IndexedDB

**Finalizar Auditoría**:
- Calcula porcentaje de cumplimiento automático
- Cambia estado a 'finalizada'
- Bloquea edición de productos
- Registra fecha de finalización

#### 3. Escaneo de Productos
**Función**: `handleScan()`, `handleCameraScan()`
**Métodos**: Teclado (Enter) y Cámara (móvil/tablet)

**Lógica de Escaneo Inteligente**:
```javascript
// Caso 1: Primer escaneo de SKU
if (!lastScanned) {
    setLastScanned(product);
    speak(product.cantidad_documento); // Anuncia cantidad
    // Auto-guarda después de 15 segundos
}

// Caso 2: Re-escaneo del mismo SKU = Abrir modal novedad
if (lastScanned && lastScanned.sku === product.sku) {
    setShowNovedadModal(true);
    speak("Ingrese novedad");
}

// Caso 3: Escaneo de SKU diferente = Guardar anterior
if (lastScanned && lastScanned.sku !== product.sku) {
    // Guarda producto anterior como "sin novedad"
    saveProduct(lastScanned, {
        cantidad_fisica: cantidad_documento,
        novedad: 'sin_novedad'
    });
    // Procesa nuevo producto
    setLastScanned(product);
}
```

**Características**:
- Búsqueda flexible de SKU (ignora mayúsculas, ceros iniciales)
- Síntesis de voz para confirmación
- Auto-guardado inteligente
- Soporte offline con sincronización

#### 4. Colaboración en Tiempo Real
**Tecnología**: WebSockets
**Función**: Conexión automática por auditoría
**Características**:
- Bloqueo automático de productos durante edición
- Notificaciones de cambios en tiempo real
- Sincronización instantánea de datos
- Reconexión automática en móviles
- Throttling de mensajes para rendimiento

**Eventos WebSocket**:
```javascript
// Bloqueo de producto
{type: 'product_locked', product_id: 123, user: 'Juan Pérez'}

// Desbloqueo de producto
{type: 'product_unlocked', product_id: 123}

// Actualización de producto
{type: 'product_updated', product: {...}, user: 'María García'}

// Ping para mantener conexión
{type: 'ping'}
```

#### 5. Gestión de Novedades
**Modal**: `NovedadModal.jsx`
**Tipos de Novedad**:
- sin_novedad: Cantidad física = cantidad documento
- faltante: Cantidad física < cantidad documento
- sobrante: Cantidad física > cantidad documento
- averia: Producto dañado
- fecha_corta: Próximo a vencer
- contaminado: Producto contaminado
- vencido: Producto vencido

**Cálculo Automático**:
```javascript
if (cantidad_fisica < cantidad_documento) {
    novedad = 'faltante';
    observaciones = `${diferencia} faltante`;
} else if (cantidad_fisica > cantidad_documento) {
    novedad = 'sobrante';
    observaciones = `${diferencia} sobrante`;
}
```

#### 6. Búsqueda y Filtros
**Búsqueda en Tiempo Real**:
- Por SKU (parcial, insensible a mayúsculas)
- Por nombre de artículo
- Debounce de 300ms para rendimiento

**Filtros**:
- Por tipo de novedad
- Por OT específica
- Paginación (20 productos por página)

#### 7. Funciones Offline
**Tecnología**: IndexedDB
**Características**:
- Guardado automático de cambios offline
- Sincronización automática al recuperar conexión
- Indicador visual de estado (online/offline)
- Contador de cambios pendientes
- Botón de sincronización manual

### MÓDULO ANALISTA (AnalystDashboard.jsx)

#### 1. Dashboard de Estadísticas
**Hook**: `useStats.js`
**KPIs Principales**:
- Total de auditorías
- Auditorías finalizadas
- Promedio de cumplimiento
- Distribución por estado

#### 2. Gráficos Interactivos
**Librería**: Chart.js
**Tipos**:
- Gráfico de barras: Cumplimiento por auditoría
- Gráfico de dona: Distribución de novedades
- Gráfico de líneas: Auditorías por período
- Gráfico de barras horizontales: Cumplimiento por auditor

#### 3. Filtros Avanzados
**Componente**: `Filters.jsx`
**Criterios**:
- Estado de auditoría (pendiente, en_progreso, finalizada)
- Auditor específico
- Rango de fechas (desde/hasta)
- Búsqueda por texto libre

#### 4. Generación de Reportes
**Formatos**: Excel (.xlsx) y PDF
**Tipos**:
- Reporte general: Todas las auditorías
- Reporte de novedades: Solo productos con novedades

**Proceso Excel**:
```javascript
const params = new URLSearchParams();
if (filters.audit_status) params.append('audit_status', filters.audit_status);
if (filters.auditor_id) params.append('auditor_id', filters.auditor_id);
// ... más filtros

const url = `${API_BASE_URL}/api/audits/report?${params}`;
// Descarga directa del archivo
```

**Proceso PDF**:
```javascript
const { generatePdfReport, prepareReportData } = await import('../../utils/pdfGenerator');
const reportData = prepareReportData(audits);
await generatePdfReport(reportData, 'general', filters);
```

#### 5. Búsqueda por OT
**Función**: `handleOtSearch()`
**Endpoint**: `GET /api/audits/search-by-ot/{ot_number}`
**Características**:
- Búsqueda exacta por número de OT
- Muestra solo productos de esa OT específica
- Validación y sanitización de entrada

### MÓDULO ADMINISTRADOR (AdminDashboard.jsx)

#### 1. Gestión de Usuarios
**CRUD Completo**:
- Crear: Validación de email único, contraseña fuerte
- Leer: Lista paginada con búsqueda
- Actualizar: Cambio de rol, datos personales
- Eliminar: Con confirmación, mantiene auditorías

#### 2. Gestión de Ubicaciones
**Componente**: `UbicacionesManager.jsx`
**Funciones**:
- Crear nuevas sedes/ubicaciones
- Editar nombres existentes
- Eliminar (si no tienen auditorías asociadas)
- Validación de nombres únicos

#### 3. Supervisión Global
**Características**:
- Vista de todas las auditorías
- Métricas de rendimiento por auditor
- Estadísticas de uso del sistema
- Logs de actividad (próximamente)

---

## 🌐 API ENDPOINTS

### Autenticación (`/api/auth`)
```
POST /login
- Body: {username: email, password: string}
- Response: {access_token, token_type, user_name, user_role, user_id}
- Rate Limit: 5 intentos/minuto por email
```

### Usuarios (`/api/users`)
```
GET /me/                    # Usuario actual (keep-alive)
GET /                       # Todos los usuarios (admin)
GET /auditors/              # Solo auditores (todos los roles)
POST /                      # Crear usuario (admin)
GET /{user_id}             # Usuario por ID (admin)
PUT /{user_id}             # Actualizar usuario (admin)
DELETE /{user_id}          # Eliminar usuario (admin)
```

### Auditorías (`/api/audits`)
```
POST /                                    # Crear auditoría JSON
POST /upload-multiple-files              # Crear desde Excel
GET /                                     # Mis auditorías o todas
GET /auditor/{auditor_id}                # Por auditor
GET /search-by-ot/{ot_number}           # Buscar por OT
GET /{audit_id}                         # Detalles de auditoría
PUT /{audit_id}/iniciar                 # Iniciar auditoría
PUT /{audit_id}/finish                  # Finalizar auditoría
PUT /{audit_id}/products/{product_id}   # Actualizar producto
POST /{audit_id}/products/bulk-update   # Actualización masiva
POST /{audit_id}/products               # Agregar producto sobrante
POST /{audit_id}/collaborators          # Agregar colaboradores
POST /{audit_id}/add-ot                 # Agregar OT adicional
GET /{audit_id}/novelties-by-sku        # Novedades por SKU
GET /{audit_id}/products/{product_id}/novelties # Novedades de producto
```

### Reportes y Estadísticas (`/api/audits`)
```
GET /report                             # Descargar Excel
GET /report/details                     # Datos para reportes
GET /statistics/status                  # Auditorías por estado
GET /statistics/average-compliance      # Cumplimiento promedio
GET /statistics/novelty-distribution    # Distribución novedades
GET /statistics/compliance-by-auditor   # Cumplimiento por auditor
GET /statistics/audits-by-period        # Auditorías por período
GET /statistics/top-novelty-skus        # SKUs con más novedades
GET /statistics/average-audit-duration  # Duración promedio
```

### Colaboración (`/api/collaboration`)
```
POST /{audit_id}/products/{product_id}/lock    # Bloquear producto
POST /{audit_id}/products/{product_id}/unlock  # Desbloquear producto
GET /{audit_id}/history                        # Historial de cambios
```

### WebSockets (`/api/ws`)
```
WS /{audit_id}?token={jwt_token}        # Conexión por auditoría
```

### Ubicaciones (`/api/ubicaciones`)
```
GET /                       # Todas las ubicaciones
POST /                      # Crear ubicación (admin)
PUT /{ubicacion_id}        # Actualizar ubicación (admin)
DELETE /{ubicacion_id}     # Eliminar ubicación (admin)
```

---

## 🔄 FLUJOS DE TRABAJO

### Flujo Completo de Auditoría

#### 1. Preparación (Auditor)
```
1. Login al sistema
2. Cargar archivo(s) Excel
   - Seleccionar ubicación origen/destino
   - Validar formato y contenido
   - Crear auditoría automáticamente
3. Agregar colaboradores (opcional)
4. Iniciar auditoría (pendiente → en_progreso)
```

#### 2. Ejecución (Auditor + Colaboradores)
```
1. Abrir auditoría activa
2. Conectar WebSocket para tiempo real
3. Escanear productos:
   a. Primer escaneo → Anuncia cantidad
   b. Segundo escaneo mismo SKU → Modal novedad
   c. Escaneo SKU diferente → Guarda anterior
4. Registrar novedades según necesidad
5. Usar búsqueda/filtros para productos específicos
6. Verificar productos no escaneados
```

#### 3. Finalización (Auditor)
```
1. Verificar todos los productos auditados
2. Revisar novedades registradas
3. Finalizar auditoría
4. Sistema calcula cumplimiento automático
5. Auditoría queda bloqueada para edición
```

#### 4. Análisis (Analista)
```
1. Ver auditorías en dashboard
2. Aplicar filtros según necesidad
3. Generar reportes (Excel/PDF)
4. Analizar estadísticas y gráficos
5. Buscar auditorías específicas por OT
```

### Flujo de Colaboración en Tiempo Real

#### Conexión WebSocket
```javascript
// Auditor A abre auditoría
1. Conecta a WS /api/ws/{audit_id}?token={jwt}
2. Recibe confirmación de conexión

// Auditor B se une como colaborador
1. Conecta al mismo WS
2. Ambos reciben notificación de nuevo colaborador
```

#### Edición Colaborativa
```javascript
// Auditor A edita producto
1. Hace clic en campo → Envía 'product_locked'
2. Auditor B ve candado en ese producto
3. Auditor A guarda cambios → Envía 'product_updated'
4. Auditor B ve cambios instantáneamente
5. Producto se desbloquea automáticamente
```

### Flujo de Sincronización Offline

#### Detección de Conexión
```javascript
// Pérdida de conexión
1. Sistema detecta offline
2. Cambia indicador visual
3. Guarda cambios en IndexedDB
4. Incrementa contador pendientes
```

#### Recuperación de Conexión
```javascript
// Conexión restaurada
1. Sistema detecta online
2. Lee cambios pendientes de IndexedDB
3. Sincroniza automáticamente con servidor
4. Actualiza indicadores visuales
5. Limpia datos offline sincronizados
```

---

## 🎨 CARACTERÍSTICAS TÉCNICAS

### Temas y Personalización
**Archivo**: `themes.css`
**Temas Disponibles**:
1. Azul Corporativo (por defecto)
2. Verde Esmeralda
3. Púrpura Elegante
4. Naranja Vibrante
5. Rosa Moderno
6. Turquesa Fresco
7. Rojo Dinámico
8. Alto Contraste (accesibilidad)

### Responsividad
**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Características Móviles**:
- Botón de cámara para escaneo
- Navegación optimizada para touch
- Tablas con scroll horizontal
- Modales adaptados a pantalla pequeña

### Síntesis de Voz
**Configuración**:
```javascript
// Preferencia de voces
selectedVoice = voices.find(v => 
    v.lang === 'es-CO' || 
    v.lang === 'es-MX'
) || voices.find(v => v.lang.startsWith('es'));

// Configuración de voz
utterance.lang = 'es-CO';
utterance.rate = 1.3;
utterance.pitch = 1.1;
utterance.volume = 1;
```

**Mensajes**:
- Cantidad de documento al escanear
- "Guardado" al actualizar producto
- "Producto no encontrado" si SKU inválido
- "Ingrese novedad" al re-escanear

### Validaciones de Seguridad

#### Archivos Excel
```javascript
// Validaciones implementadas
- Extensión: solo .xlsx, .xls
- Tamaño: máximo 10MB por archivo
- Cantidad: máximo 10 archivos simultáneos
- Contenido: verificación de headers Excel reales
- MIME type: validación de tipo de contenido
```

#### Entrada de Datos
```javascript
// Sanitización OT
function validate_ot_number(ot) {
    // Solo alfanuméricos, guiones y espacios
    return re.match(r'^[a-zA-Z0-9\s\-]{1,50}$', ot.strip())
}

// Contraseñas fuertes
function validate_password_strength(password) {
    // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
    return (len(password) >= 8 && 
            re.search(r'[A-Z]', password) &&
            re.search(r'[a-z]', password) &&
            re.search(r'\d', password))
}
```

### Rate Limiting
```python
# Global: 100 requests/minuto por IP
# Login: 5 intentos/minuto por email
# Headers de respuesta:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🔒 SEGURIDAD

### Protecciones Implementadas

#### 1. Autenticación JWT
- Tokens con expiración configurable (30 min por defecto)
- Refresh automático en requests
- Logout limpia tokens del localStorage

#### 2. Rate Limiting
- Global: 100 requests/minuto por IP
- Login: 5 intentos/minuto por email
- Headers informativos en respuestas

#### 3. Validación de Entrada
- Contraseñas fuertes obligatorias
- Sanitización de números OT
- Validación estricta de archivos Excel
- Límites de tamaño y cantidad

#### 4. Headers de Seguridad HTTP
```python
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

#### 5. CORS Restrictivo
- Solo orígenes autorizados
- Métodos limitados: GET, POST, PUT, DELETE
- Credentials permitidas solo para dominios confiables

#### 6. Protección IDOR
- Verificación de permisos por rol
- Validación de acceso a recursos propios
- Filtros automáticos por usuario/rol

### Vulnerabilidades Conocidas (Requieren Cambios Mayores)

#### 1. JWT en LocalStorage
**Riesgo**: Vulnerable a XSS
**Mitigación Actual**: Headers de seguridad, validación entrada
**Solución Futura**: Migrar a cookies HttpOnly

#### 2. Token en URL WebSocket
**Riesgo**: Visible en logs de servidor
**Mitigación Actual**: Logs no persistentes
**Solución Futura**: Autenticación por mensaje inicial

#### 3. Sin CSRF Protection
**Riesgo**: Ataques CSRF
**Mitigación Actual**: CORS restrictivo, validación origen
**Solución Futura**: Tokens CSRF

---

## 🚀 INSTALACIÓN Y DESPLIEGUE

### Desarrollo Local

#### Prerrequisitos
```bash
- Python 3.11+
- Node.js 18+ (para frontend)
- PostgreSQL (opcional, usa SQLite por defecto)
- Git
```

#### Instalación Backend
```bash
# Clonar repositorio
git clone <url-repositorio>
cd app_auditorias

# Crear entorno virtual
python -m venv venv
.\venv\Scripts\activate.bat  # Windows
source venv/bin/activate     # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con configuraciones locales

# Ejecutar migraciones
alembic upgrade head

# Crear usuario administrador
python create_admin.py

# Ejecutar servidor
uvicorn backend.main:app --reload
```

#### Instalación Frontend
```bash
cd frontend-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con URL del backend

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

### Despliegue en Render

#### Configuración Backend
```yaml
# render.yaml
services:
  - type: web
    name: app-auditorias
    env: python
    buildCommand: |
      pip install -r requirements.txt
      cd frontend-app && npm install && npm run build
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: auditorias-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: PRODUCTION_URL
        value: https://app-auditorias.onrender.com
```

#### Variables de Entorno Producción
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=<generated-secret>
PRODUCTION_URL=https://app-auditorias.onrender.com
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
```

#### Base de Datos PostgreSQL
```sql
-- Configuración automática en Render
-- Migraciones ejecutadas automáticamente
-- Backup automático incluido
```

### Comandos Útiles

#### Desarrollo
```bash
# Ejecutar tests
python -m pytest tests/

# Verificar migraciones
python check_migration.py

# Limpiar base de datos
python delete_audits.py

# Verificar despliegue
python verify_deploy.py
```

#### Producción
```bash
# Ver logs
render logs --service app-auditorias

# Ejecutar migración manual
render shell --service app-auditorias
alembic upgrade head

# Reiniciar servicio
render restart --service app-auditorias
```

---

## 📊 MÉTRICAS Y MONITOREO

### KPIs del Sistema
- Auditorías creadas por día/semana/mes
- Tiempo promedio de finalización de auditorías
- Porcentaje de cumplimiento promedio
- Distribución de novedades por tipo
- Usuarios activos por período
- Productos auditados por hora/día

### Logs de Aplicación
- Intentos de login (exitosos/fallidos)
- Creación de auditorías
- Finalización de auditorías
- Errores de validación
- Timeouts de WebSocket
- Sincronizaciones offline

### Alertas Recomendadas
- Rate limit excedido frecuentemente
- Errores de base de datos
- Fallos de WebSocket recurrentes
- Archivos Excel rechazados
- Usuarios bloqueados por intentos fallidos

---

## 🔧 MANTENIMIENTO

### Tareas Regulares
- Actualizar dependencias Python/Node.js
- Revisar logs de seguridad
- Limpiar archivos temporales
- Optimizar consultas de base de datos
- Verificar integridad de datos

### Backup y Recuperación
- Backup automático de PostgreSQL en Render
- Exportación manual de datos críticos
- Procedimientos de restauración documentados
- Testing de backups periódico

### Actualizaciones
- Versionado semántico (MAJOR.MINOR.PATCH)
- Migraciones de base de datos con Alembic
- Deploy sin downtime en Render
- Rollback automático en caso de errores

---

## 📞 SOPORTE Y CONTACTO

### Documentación Adicional
- `INSTRUCTIVO_USUARIO.md`: Manual detallado para usuarios finales
- `SECURITY_REPORT.md`: Reporte completo de seguridad
- `DEPLOY_INSTRUCTIONS.md`: Instrucciones de despliegue
- `API Documentation`: http://127.0.0.1:8000/docs (desarrollo)

### Estructura de Soporte
- **Nivel 1**: Problemas de usuario (login, navegación)
- **Nivel 2**: Problemas técnicos (sincronización, archivos)
- **Nivel 3**: Problemas de infraestructura (base de datos, servidor)

---

**Versión**: 1.0  
**Fecha**: Diciembre 2024  
**Mantenido por**: Equipo de Desarrollo NEMESIS  
**Licencia**: Propietaria  

---

© 2024 NEMESIS. Todos los derechos reservados.

---

## 📝 NOTAS PARA CREACIÓN DE MANUAL DE FUNCIONES

Esta documentación contiene toda la información necesaria para crear un manual de funciones completo que incluya:

1. **Descripción detallada de cada función del sistema**
2. **Flujos de trabajo paso a paso**
3. **Capturas de pantalla recomendadas para cada proceso**
4. **Casos de uso específicos por rol**
5. **Solución de problemas comunes**
6. **Mejores prácticas de uso**
7. **Configuraciones avanzadas**
8. **Integración con otros sistemas**

El manual debe estructurarse por roles (Auditor, Analista, Administrador) y incluir ejemplos prácticos, troubleshooting y FAQ específicos para cada funcionalidad.