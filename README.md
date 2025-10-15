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
- Escanear productos con SKU
- Registrar cantidades físicas y novedades
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
4. **Auditar Productos**:
   - Escanear SKU con Enter
   - Registrar cantidad física
   - Seleccionar novedad (Sin Novedad, Faltante, Sobrante, Avería)
   - Agregar observaciones
5. **Guardar Cambios** individualmente o en lote
6. **Finalizar Auditoría** y ver porcentaje de cumplimiento

## 🛠️ Tecnologías

### Backend
- **FastAPI**: Framework web moderno y rápido
- **SQLAlchemy**: ORM para base de datos
- **Pandas**: Procesamiento de archivos Excel
- **JWT**: Autenticación segura
- **Pydantic**: Validación de datos

### Frontend
- **HTML5/CSS3**: Estructura y estilos
- **JavaScript ES6**: Lógica de la aplicación
- **Bootstrap 5**: Framework CSS
- **Chart.js**: Gráficos y visualizaciones

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
│   └── services/           # Servicios de negocio
├── frontend/               # Aplicación Web
│   ├── index.html          # Página principal
│   ├── script.js           # Lógica JavaScript
│   └── style.css           # Estilos CSS
├── venv/                   # Entorno virtual Python
├── uploads/                 # Archivos subidos
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
- ✅ **Escaneo de Productos Flexible**: Búsqueda inteligente de SKUs que tolera diferencias de mayúsculas/minúsculas y ceros iniciales (ej. `pd123` o `000123`).
- ✅ **Auditoría en Tiempo Real**: Cálculo de cumplimiento automático
- ✅ **Múltiples Roles**: Auditor, Analista, Administrador
- ✅ **Interfaz Moderna**: Diseño responsive y intuitivo
- ✅ **Base de Datos**: Persistencia de datos segura
- ✅ **API RESTful**: Endpoints bien documentados

---

**<!-- Trigger Render deploy -->
