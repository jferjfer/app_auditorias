# 🔧 Solución de Problemas - Pantalla en Blanco en Render (Rol Analista)

## 🐛 Problema
Cuando un usuario con rol "analista" inicia sesión en Render, la pantalla se queda en blanco después de hacer clic en "Iniciar Sesión".

## ✅ Soluciones Implementadas

### 1. **Mejor Manejo de Errores en fetchStats**
- **Problema**: Si alguna de las 7 llamadas a la API fallaba, podía retornar `null` y romper el renderizado
- **Solución**: Ahora retorna datos por defecto (vacíos pero válidos) en caso de error
- **Archivo**: `frontend-app/src/services/api.js`

### 2. **ErrorBoundary para Capturar Errores de Renderizado**
- **Problema**: Errores en componentes hijos causaban pantalla en blanco sin mensaje
- **Solución**: Agregado ErrorBoundary que muestra mensaje de error y botón de recarga
- **Archivos**: 
  - `frontend-app/src/components/ErrorBoundary.jsx` (nuevo)
  - `frontend-app/src/pages/AnalystDashboard.jsx` (modificado)

### 3. **Validación de Estado Null en Dashboard**
- **Problema**: Si `data` era `null`, los componentes podían fallar
- **Solución**: Agregada validación explícita para estado `null` con mensaje y botón de recarga
- **Archivo**: `frontend-app/src/components/AnalystDashboard/AnalystDashboard.jsx`

### 4. **Logging Detallado para Debug**
- **Problema**: Difícil diagnosticar dónde falla el proceso
- **Solución**: Agregados console.log en puntos críticos:
  - Login (email, rol, token guardado)
  - Carga de estadísticas
  - Carga de auditorías
- **Archivos**: 
  - `frontend-app/src/pages/Login.jsx`
  - `frontend-app/src/components/AnalystDashboard/AnalystDashboard.jsx`

### 5. **Validación de Token en Login**
- **Problema**: Token podría no guardarse correctamente en localStorage
- **Solución**: Validación explícita después de guardar el token
- **Archivos**:
  - `frontend-app/src/services/auth.js`
  - `frontend-app/src/pages/Login.jsx`

## 🔍 Cómo Diagnosticar el Problema

### Paso 1: Abrir Consola del Navegador
1. En Render, abre la aplicación
2. Presiona `F12` o `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Ve a la pestaña "Console"

### Paso 2: Intentar Login como Analista
Observa los mensajes en consola:

```javascript
// ✅ Login exitoso debería mostrar:
"Iniciando login para: analista@example.com"
"Login exitoso: { user_role: 'analista', user_name: 'Juan', token_guardado: true }"
"Credenciales guardadas exitosamente"
"Redirigiendo a: analista"
"AnalystDashboard montado"
"Cargando auditorías con filtros: {}"
"Estado del dashboard: { data: {...}, loading: false, error: null }"
```

### Paso 3: Identificar el Error

#### Error 1: Token no se guarda
```javascript
"Error guardando en localStorage"
```
**Causa**: Problema con localStorage en el navegador
**Solución**: Verificar que el navegador permite localStorage (no modo incógnito estricto)

#### Error 2: API no responde
```javascript
"Error cargando estadísticas: Failed to fetch"
```
**Causa**: Backend no está accesible o CORS mal configurado
**Solución**: 
- Verificar que `VITE_API_BASE` está configurado correctamente en Render
- Verificar que el backend está corriendo
- Revisar configuración de CORS en `backend/main.py`

#### Error 3: Token inválido/expirado
```javascript
"Error cargando auditorías: 401 Unauthorized"
```
**Causa**: Token JWT inválido o expirado
**Solución**: 
- Verificar `SECRET_KEY` en variables de entorno de Render
- Verificar que `ACCESS_TOKEN_EXPIRE_MINUTES` es suficiente

#### Error 4: Datos incompletos
```javascript
"Respuesta incompleta del servidor"
```
**Causa**: Backend no retorna todos los campos necesarios
**Solución**: Verificar endpoint `/api/auth/login` en backend

## 🛠️ Verificaciones en Render

### 1. Variables de Entorno (Frontend)
En el servicio de frontend en Render, verifica:
```bash
VITE_API_BASE=https://tu-backend.onrender.com
```

### 2. Variables de Entorno (Backend)
En el servicio de backend en Render, verifica:
```bash
SECRET_KEY=tu-clave-secreta-segura
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://...
```

### 3. CORS en Backend
Verifica en `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tu-frontend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Logs del Backend
En Render, ve a tu servicio backend → Logs y busca:
```
Login attempt for: analista@example.com
```

## 🧪 Pruebas Locales

Para reproducir el problema localmente:

```bash
# 1. Activar entorno virtual
.\venv\Scripts\activate.bat

# 2. Correr backend
uvicorn backend.main:app --reload

# 3. En otra terminal, correr frontend
cd frontend-app
npm run dev

# 4. Abrir http://localhost:5173
# 5. Login como analista y revisar consola
```

## 📊 Endpoints que Usa el Dashboard del Analista

El dashboard hace estas llamadas al cargar:
1. `/api/audits/statistics/status`
2. `/api/audits/statistics/average-compliance`
3. `/api/audits/statistics/novelty-distribution`
4. `/api/audits/statistics/compliance-by-auditor`
5. `/api/audits/statistics/audits-by-period`
6. `/api/audits/statistics/top-novelty-skus`
7. `/api/audits/statistics/average-audit-duration`
8. `/api/audits/report/details`

**Prueba manual**: Abre en el navegador (con token):
```
https://tu-backend.onrender.com/api/audits/statistics/status
```

## 🚀 Próximos Pasos

Si el problema persiste después de estas soluciones:

1. **Revisar logs de Render** (tanto frontend como backend)
2. **Verificar Network tab** en DevTools para ver qué llamadas fallan
3. **Probar con otro navegador** para descartar problemas del navegador
4. **Verificar que el backend responde** haciendo curl a los endpoints
5. **Revisar límites de rate limiting** en el backend

## 📝 Notas Adicionales

- El ErrorBoundary ahora captura cualquier error de renderizado y muestra un mensaje amigable
- Los logs en consola ayudan a identificar exactamente dónde falla el proceso
- Si `data` es null, ahora se muestra un mensaje con botón de recarga
- Todos los errores de API ahora retornan datos por defecto en lugar de null

---

**Última actualización**: ${new Date().toISOString().split('T')[0]}
