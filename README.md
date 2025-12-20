# 🏢 Sistema de Auditorías - Aplicación Web

Sistema completo para la gestión de auditorías de inventario con carga de archivos Excel, escaneo de productos en tiempo real, dashboards analíticos y despliegue en la nube.

## 🚀 Inicio Rápido (Desarrollo Local)

### Opción 1: Configuración Rápida (Recomendada)

```bash
# 1. Clonar y configurar
git clone <url-del-repositorio>
cd app_auditorias

# 2. Crear entorno virtual e instalar dependencias
python -m venv venv
.\venv\Scripts\activate.bat
pip install -r requirements.txt

# 3. Configurar variables de entorno
copy .env.example .env
# Editar .env con tu configuración (ver LOCAL_SETUP.md)

# 4. Verificar configuración
python verify_setup.py

# 5. Ejecutar backend
uvicorn backend.main:app --reload

# 6. Ejecutar frontend (nueva terminal)
cd frontend-app
npm install
npm run dev
```

### Opción 2: Conectar a Base de Datos de Render

Para trabajar localmente con la BD de producción:

```bash
# Editar .env y usar la URL de PostgreSQL de Render
DATABASE_URL=postgresql://usuario:password@host.render.com/database?sslmode=require
DEBUG=True
```

📖 **Documentación completa**: Ver [LOCAL_SETUP.md](LOCAL_SETUP.md)

## 🌐 URLs de Acceso

- **Aplicación (Frontend y Backend)**: http://127.0.0.1:8000
- **Documentación API**: http://127.0.0.1:8000/docs

## 👥 Roles de Usuario

### 🔍 Auditor
- Cargar archivos Excel de órdenes de traslado
- Iniciar y gestionar auditorías
- Agregar colaboradores a auditorías
- Escanear productos con SKU o cámara
- Registrar cantidades físicas y novedades
- Ver historial de cambios en tiempo real
- Finalizar auditorías con cálculo de cumplimiento

### 📊 Analista
- Ver todas las auditorías
- Generar reportes y gráficos
- Analizar porcentajes de cumplimiento
- Filtrar por auditor, fecha, estado

### ⚙️ Administrador
- Gestionar usuarios del sistema
- Ver todas las auditorías
- Supervisar el rendimiento del sistema

## 📋 Flujo de Trabajo del Auditor

1. **Iniciar Sesión** como usuario con rol "auditor"
2. **Cargar Archivos Excel** de órdenes de traslado
3. **Iniciar Auditoría** desde "Mis Auditorías"
4. **Seleccionar Modo de Auditoría**:
   - **Modo Normal**: Escaneo tradicional con validación inmediata
   - **Modo Conteo Rápido**: Escaneo masivo optimizado, incrementa cantidades automáticamente
5. **Agregar Colaboradores** (opcional) para auditorías en equipo
6. **Auditar Productos**:
   - Escanear SKU con Enter o cámara 📷
   - Registrar cantidad física
   - Seleccionar novedad (Sin Novedad, Faltante, Sobrante, Avería, etc.)
   - Agregar observaciones
7. **Guardar Cambios** automáticamente con sincronización en tiempo real
8. **Ver Historial** de cambios realizados por todos los colaboradores
9. **Finalizar Auditoría** y ver porcentaje de cumplimiento

## 🛠️ Tecnologías

### Backend
- **FastAPI**: Framework web moderno y rápido
- **SQLAlchemy**: ORM para base de datos
- **WebSockets**: Sincronización en tiempo real
- **Pandas**: Procesamiento de archivos Excel
- **JWT**: Autenticación segura
- **Pydantic**: Validación de datos

### Frontend
- **React 18**: Biblioteca UI moderna
- **React Router**: Navegación SPA
- **Bootstrap 5**: Framework CSS responsive
- **Chart.js**: Gráficos y visualizaciones
- **html5-qrcode**: Escaneo con cámara

### Base de Datos
- **PostgreSQL**: Base de datos principal
- **Alembic**: Migraciones de base de datos

## 📁 Estructura del Proyecto

```
app_auditorias/
├── backend/                 # API Backend
│   ├── main.py             # Aplicación principal
│   ├── models.py           # Modelos de base de datos
│   ├── schemas.py          # Esquemas Pydantic
│   ├── crud.py             # Operaciones de base de datos
│   ├── database.py         # Configuración de BD
│   └── routers/            # Endpoints API
│       ├── auth.py         # Autenticación
│       ├── audits.py       # Auditorías
│       ├── users.py        # Usuarios
│       ├── websockets.py   # WebSockets
│       └── collaboration.py # Colaboración
├── frontend-app/           # Aplicación React
│   ├── src/
│   │   ├── pages/          # Páginas principales
│   │   ├── components/     # Componentes reutilizables
│   │   ├── services/       # API y autenticación
│   │   └── styles/         # CSS y temas
│   └── package.json        # Dependencias Node
├── alembic/                # Migraciones de BD
├── venv/                   # Entorno virtual Python
├── requirements.txt        # Dependencias Python
└── README.md              # Este archivo
```

## 🔧 Configuración

### Requisitos del Sistema
- Python 3.11+
- Node.js 18+ (para frontend)
- PostgreSQL (opcional, puede usar SQLite o conectar a Render)
- Navegador web moderno

### Variables de Entorno

El proyecto usa un archivo `.env` para configuración local:

```env
# Desarrollo local con BD de Render
SECRET_KEY=tu_clave_secreta
DATABASE_URL=postgresql://user:pass@host.render.com/db?sslmode=require
DEBUG=True
```

⚠️ **IMPORTANTE**: 
- El archivo `.env` está en `.gitignore` y NO se sube a Git
- Render usa sus propias variables de entorno (configuradas en el dashboard)
- Tu configuración local NO afecta el despliegue en Render

### Instalación de Dependencias
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend-app
npm install
```

## 🚨 Solución de Problemas

### Error de Puerto Ocupado
Si el puerto 3000 está ocupado, puedes iniciar el servidor en otro puerto cambiando el comando:
```bash
# Ejemplo para usar el puerto 3001
python -m http.server 3001
```

### Error de PowerShell
```bash
# Usar archivos .bat en lugar de .ps1
.\venv\Scripts\activate.bat
```

### Error de CORS
- Asegúrate de usar el servidor HTTP: `python -m http.server 3000`
- No abrir index.html directamente en el navegador

## 📞 Soporte

Si tienes problemas:
1. Verifica que ambos servidores estén ejecutándose
2. Revisa la consola del navegador para errores
3. Verifica que el backend esté en http://127.0.0.1:8000
4. Asegúrate de usar el frontend en http://localhost:3000

## 🎯 Características Principales

### 📦 Gestión de Auditorías
- ✅ **Carga de Archivos Excel**: Procesamiento automático de órdenes de traslado
- ✅ **Búsqueda por OT**: Localiza auditorías específicas por número de orden de traslado
- ✅ **Agregar OTs Dinámicamente**: Añade órdenes adicionales a auditorías en progreso
- ✅ **Dos Modos de Auditoría**:
  - **Modo Normal**: Escaneo tradicional con validación paso a paso
  - **Modo Conteo Rápido**: Escaneo masivo optimizado para grandes volúmenes

### 🔍 Escaneo Inteligente
- ✅ **Búsqueda Flexible de SKUs**: Tolera mayúsculas/minúsculas y ceros iniciales (ej. `pd123` o `000123`)
- ✅ **Búsqueda Optimizada**: Se detiene al encontrar el primer resultado (modo conteo rápido)
- ✅ **Productos No Referenciados**: Busca descripciones en BD automáticamente
- ✅ **Escaneo con Cámara**: Lector QR/código de barras para móviles y tablets
- ✅ **Reconocimiento de Voz**: Confirmación auditiva de cantidades escaneadas

### 👥 Colaboración en Tiempo Real
- ✅ **Auditoría Colaborativa**: Múltiples auditores trabajando simultáneamente
- ✅ **Sincronización WebSocket**: Actualizaciones en tiempo real entre colaboradores
- ✅ **Lock de Productos**: Bloqueo temporal al editar para prevenir conflictos
- ✅ **Notificaciones en Vivo**: Alertas de ediciones y cambios de otros usuarios
- ✅ **Historial de Cambios**: Tracking completo (quién, cuándo, qué)

### 📴 Modo Offline
- ✅ **Trabajo Sin Internet**: Continúa auditando sin conexión
- ✅ **Almacenamiento Local**: IndexedDB guarda cambios pendientes
- ✅ **Sincronización Automática**: Al reconectar, sincroniza todos los cambios
- ✅ **Búsqueda Diferida**: Busca descripciones de SKUs al volver online
- ✅ **Indicadores Visuales**: Muestra estado de conexión y cambios pendientes

### 📊 Análisis y Reportes
- ✅ **Dashboard Analítico**: Gráficos de cumplimiento, novedades y tendencias
- ✅ **Filtros Avanzados**: Por auditor, fecha, estado, OT
- ✅ **Exportación**: Genera reportes en Excel y PDF
- ✅ **Estadísticas en Tiempo Real**: KPIs actualizados automáticamente

### 🎨 Interfaz y UX
- ✅ **Diseño Responsive**: Optimizado para móviles, tablets y desktop
- ✅ **7 Temas de Color**: Personalización visual
- ✅ **Modo Alto Contraste**: Accesibilidad mejorada
- ✅ **Paginación Inteligente**: 10 items en modo rápido, 20 en modo normal

### 🔐 Seguridad
- ✅ **Múltiples Roles**: Auditor, Analista, Administrador
- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta
- ✅ **Validación de Archivos**: Solo Excel válidos, máx 10MB
- ✅ **Contraseñas Fuertes**: Requisitos de complejidad
- ✅ **Headers de Seguridad**: X-Frame-Options, HSTS, XSS Protection
- ✅ **JWT Authentication**: Tokens seguros con expiración

### 🏗️ Arquitectura
- ✅ **API RESTful**: Endpoints documentados con FastAPI
- ✅ **Base de Datos**: PostgreSQL con migraciones Alembic
- ✅ **WebSockets**: Comunicación bidireccional en tiempo real
- ✅ **IndexedDB**: Persistencia local para modo offline

## 🔒 Seguridad

El sistema implementa múltiples capas de protección:

- **Rate Limiting**: 100 requests/min global, 5 intentos/min en login
- **Validación de Archivos**: Solo Excel válidos, máx 10MB, verificación de contenido
- **Contraseñas Fuertes**: Mínimo 8 caracteres con mayúsculas, minúsculas y números
- **Headers de Seguridad**: X-Frame-Options, X-XSS-Protection, HSTS
- **Sanitización de Entrada**: Validación y limpieza de todos los inputs
- **CORS Restrictivo**: Solo orígenes autorizados
- **Protección IDOR**: Verificación de permisos por rol
- **Timing Attack Protection**: Delays constantes en autenticación

Ver [SECURITY_REPORT.md](SECURITY_REPORT.md) para detalles completos.
Ver [SECURITY_TESTS.md](SECURITY_TESTS.md) para pruebas de seguridad.

---

**<!-- Trigger Render deploy -->
