# 🚀 Configuración Local con Base de Datos Render

## 📋 Prerrequisitos
- Python 3.11+
- Node.js 18+ (para el frontend)
- Git

## ⚙️ Configuración Paso a Paso

### 1. Clonar y Configurar Entorno Virtual

```bash
# Navegar al proyecto
cd app_auditorias

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
.\venv\Scripts\activate.bat
# Linux/Mac:
source venv/bin/activate
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias de Python
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
copy .env.example .env

# Editar .env con tu editor favorito
notepad .env
```

**Configuración para conectar a BD de Render:**

```env
SECRET_KEY=tu_clave_secreta_super_larga_y_segura_aqui
DATABASE_URL=postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require
DEBUG=True
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> ⚠️ **IMPORTANTE**: El archivo `.env` está en `.gitignore` y NO se subirá a Git ni a Render.

### 4. Ejecutar Backend (FastAPI)

```bash
# Desde la raíz del proyecto
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en:
- API: http://127.0.0.1:8000
- Documentación: http://127.0.0.1:8000/docs

### 5. Ejecutar Frontend (React + Vite)

```bash
# Abrir nueva terminal
cd frontend-app

# Instalar dependencias (solo la primera vez)
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend estará disponible en:
- App: http://localhost:3000

## 🔄 Cómo Funciona

### Desarrollo Local
- Tu código corre en tu máquina (localhost)
- Se conecta a la base de datos PostgreSQL en Render
- Los cambios en el código se reflejan inmediatamente (hot reload)
- **NO afecta** el despliegue en Render

### Despliegue en Render
- Render usa sus propias variables de entorno (configuradas en el dashboard)
- Render NO lee tu archivo `.env` local
- El archivo `.env` está en `.gitignore` y nunca se sube

## 📊 Verificar Conexión a BD

```python
# Ejecutar en Python para probar conexión
python -c "from backend.database import engine; print('✅ Conexión exitosa' if engine else '❌ Error')"
```

## 🛠️ Comandos Útiles

```bash
# Ver logs del backend
uvicorn backend.main:app --reload --log-level debug

# Ejecutar migraciones (si es necesario)
alembic upgrade head

# Crear usuario admin (si es necesario)
python create_admin.py

# Limpiar base de datos (¡CUIDADO!)
python clear_database.py
```

## 🔐 Seguridad

### ✅ Buenas Prácticas
- ✅ `.env` está en `.gitignore`
- ✅ Nunca subas credenciales a Git
- ✅ Usa diferentes SECRET_KEY en local y producción
- ✅ La BD de Render tiene SSL habilitado (`sslmode=require`)

### ⚠️ Advertencias
- ⚠️ Estás trabajando con la BD de producción
- ⚠️ Los cambios que hagas afectarán los datos reales
- ⚠️ Usa `DEBUG=True` solo en desarrollo

## 🐛 Solución de Problemas

### Error: "No module named 'backend'"
```bash
# Asegúrate de estar en la raíz del proyecto
cd app_auditorias
python -m uvicorn backend.main:app --reload
```

### Error: "Connection refused" (BD)
- Verifica que la URL de la BD sea correcta
- Verifica que tengas acceso a internet
- Verifica que la BD de Render esté activa

### Error: "Port 8000 already in use"
```bash
# Matar proceso en el puerto
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

### Error: CORS en el frontend
- Asegúrate de que el backend esté corriendo en el puerto 8000
- Verifica la configuración de proxy en `vite.config.js`

## 📝 Notas Importantes

1. **Archivo `.env` es local**: Cada desarrollador tiene su propio `.env`
2. **Render usa variables de entorno**: Configuradas en el dashboard de Render
3. **No afecta producción**: Tu `.env` local NO se sube a Render
4. **BD compartida**: Si varios desarrolladores usan la misma BD de Render, verán los mismos datos

## 🚀 Desplegar Cambios a Render

```bash
# 1. Hacer commit de tus cambios
git add .
git commit -m "Descripción de cambios"

# 2. Push a la rama principal
git push origin main

# 3. Render detectará el push y desplegará automáticamente
```

Render usará:
- Las variables de entorno configuradas en su dashboard
- El archivo `requirements.txt` para instalar dependencias
- El comando configurado en `render.yaml` o en el dashboard

---

**¿Necesitas ayuda?** Revisa la documentación en `README.md` o contacta al equipo.
