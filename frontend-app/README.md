# 🚀 Frontend React - Sistema de Auditorías

Frontend moderno desarrollado con React + Vite para el sistema de auditorías de inventario.

## 📋 Requisitos Previos

- Node.js 16+ 
- npm o yarn
- Backend FastAPI corriendo en `http://127.0.0.1:8000`

## 🔧 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar archivo de variables de entorno (opcional)
cp .env.example .env

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 📦 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

## 🏗️ Estructura del Proyecto

```
src/
├── assets/              # Imágenes y recursos estáticos
├── components/          # Componentes React
│   ├── AnalystDashboard/
│   ├── modals/
│   ├── ProtectedRoute.jsx
│   ├── Sidebar.jsx
│   └── Topbar.jsx
├── hooks/               # Custom hooks
│   └── useStats.js
├── pages/               # Páginas principales
│   ├── AdminDashboard.jsx
│   ├── AnalystDashboard.jsx
│   ├── AuditorDashboard.jsx
│   └── Login.jsx
├── services/            # Servicios API
│   ├── api.js
│   └── auth.js
├── utils/               # Utilidades
│   └── pdfGenerator.js
├── styles/              # Estilos CSS
├── App.jsx              # Componente principal
└── main.jsx             # Punto de entrada
```

## 👥 Roles y Funcionalidades

### 🔍 Auditor
- Cargar archivos Excel de órdenes de traslado
- Iniciar y gestionar auditorías
- Escanear productos con SKU
- Registrar cantidades físicas y novedades
- Finalizar auditorías

### 📊 Analista
- Ver todas las auditorías con filtros
- Generar reportes (Excel y PDF)
- Analizar estadísticas y gráficos
- Filtrar por auditor, fecha, estado

### ⚙️ Administrador
- Gestionar usuarios (CRUD)
- Ver auditorías del día
- Supervisar el sistema

## 🔐 Autenticación

El sistema usa JWT tokens almacenados en `localStorage`:
- `access_token`: Token de autenticación
- `current_user`: Datos del usuario (id, nombre, rol)

## 🌐 Configuración de API

### Desarrollo (con proxy)
Por defecto, Vite proxy las peticiones `/api/*` al backend en `http://127.0.0.1:8000`

### Producción
Configurar `VITE_API_BASE` en `.env`:
```
VITE_API_BASE=https://app-auditorias.onrender.com
```

## 📊 Características Implementadas

✅ Login con redirección por rol  
✅ Dashboard Auditor (carga Excel, escaneo, edición)  
✅ Dashboard Analista (estadísticas, gráficos, reportes)  
✅ Dashboard Admin (gestión usuarios, auditorías)  
✅ Generación de reportes PDF con diseño personalizado  
✅ Exportación a Excel  
✅ Gráficos interactivos (Chart.js)  
✅ Filtros avanzados con fechas  
✅ Rutas protegidas por rol  
✅ Responsive design  

## 🛠️ Tecnologías

- **React 18** - Librería UI
- **Vite** - Build tool
- **React Router** - Navegación
- **Chart.js** - Gráficos
- **Bootstrap 5** - Framework CSS
- **jsPDF** - Generación de PDFs
- **Flatpickr** - Date picker

## 🚀 Despliegue

```bash
# Build para producción
npm run build

# Los archivos estarán en /dist
```

Configurar el servidor web para servir `index.html` en todas las rutas (SPA).

## 📝 Notas

- El backend debe estar corriendo antes de iniciar el frontend
- Los archivos Excel deben tener el formato esperado por el backend
- Las imágenes para PDF deben estar en `/src/assets/images/`

---

**Desarrollado con ❤️ para el Sistema de Auditorías Nemesis**
