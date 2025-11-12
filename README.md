# 🏢 Sistema de Auditorías - Aplicación Web

Sistema completo para la gestión de auditorías de inventario con carga de archivos Excel, escaneo de productos en tiempo real, dashboards analíticos y despliegue en la nube.

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Prerrequisitos
- Python 3.11+
- Un editor de código como VS Code
- Git

### 2. Instalación y Ejecución

```bash
# 1. Clona el repositorio (si aún no lo has hecho)
# git clone <url-del-repositorio>
# cd app_auditorias

# 2. Crea y activa un entorno virtual
python -m venv venv
.\venv\Scripts\activate.bat

# 3. Instala las dependencias
pip install -r requirements.txt

# 4. Ejecuta el servidor
# El servidor de FastAPI sirve tanto el backend como el frontend.
# No necesitas un segundo servidor.
uvicorn backend.main:app --reload
```

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
4. **Agregar Colaboradores** (opcional) para auditorías en equipo
5. **Auditar Productos**:
   - Escanear SKU con Enter o cámara 📷
   - Registrar cantidad física
   - Seleccionar novedad (Sin Novedad, Faltante, Sobrante, Avería, etc.)
   - Agregar observaciones
6. **Guardar Cambios** automáticamente con sincronización en tiempo real
7. **Ver Historial** de cambios realizados por todos los colaboradores
8. **Finalizar Auditoría** y ver porcentaje de cumplimiento

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
- PostgreSQL (opcional, puede usar SQLite)
- Navegador web moderno

### Instalación de Dependencias
```bash
# Activar entorno virtual
.\venv\Scripts\activate.bat

# Instalar dependencias (si es necesario)
pip install -r requirements.txt
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

- ✅ **Carga de Archivos Excel**: Procesamiento automático de órdenes de traslado
- ✅ **Escaneo de Productos Flexible**: Búsqueda inteligente de SKUs que tolera diferencias de mayúsculas/minúsculas y ceros iniciales (ej. `pd123` o `000123`)
- ✅ **Escaneo con Cámara**: Lector QR/código de barras para móviles y tablets
- ✅ **Auditoría Colaborativa**: Múltiples auditores trabajando simultáneamente con sincronización en tiempo real
- ✅ **Lock de Productos**: Bloqueo temporal al editar para prevenir conflictos
- ✅ **Historial de Cambios**: Tracking completo de modificaciones (quién, cuándo, qué)
- ✅ **Notificaciones en Tiempo Real**: Alertas de ediciones y conflictos vía WebSocket
- ✅ **Múltiples Roles**: Auditor, Analista, Administrador
- ✅ **Interfaz Moderna**: Diseño responsive con 7 temas de color y modo alto contraste
- ✅ **Base de Datos**: PostgreSQL con persistencia segura
- ✅ **API RESTful**: Endpoints documentados con FastAPI
- ✅ **Seguridad Reforzada**: Rate limiting, validación de archivos, contraseñas fuertes, headers de seguridad

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
