# 🚀 Instrucciones de Despliegue en Render

## Opción 1: Despliegue Automático con render.yaml

### Paso 1: Preparar el Repositorio
```bash
# Asegúrate de que todos los cambios estén commiteados
git add .
git commit -m "Preparar para despliegue en Render"
git push origin main
```

### Paso 2: Crear Servicio en Render
1. Ve a https://dashboard.render.com
2. Click en "New +" → "Blueprint"
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el `render.yaml`
5. Click en "Apply"

### Paso 3: Configurar Variables de Entorno
Render creará automáticamente:
- `SECRET_KEY` (generada automáticamente)
- `DATABASE_URL` (desde la base de datos PostgreSQL)
- `DEBUG=False`
- `ACCESS_TOKEN_EXPIRE_MINUTES=30`

### Paso 4: Esperar el Despliegue
- El build tardará ~5-10 minutos
- Render ejecutará `build.sh` automáticamente
- Se instalará Python, Node.js, dependencias y construirá el frontend

---

## Opción 2: Despliegue Manual

### Paso 1: Crear Base de Datos PostgreSQL
1. En Render Dashboard → "New +" → "PostgreSQL"
2. Nombre: `app-auditorias-db`
3. Database: `app_auditorias_b5oy`
4. User: `app_auditorias_b5oy_user`
5. Region: Oregon
6. Plan: Free
7. Click "Create Database"
8. **Copia la "Internal Database URL"**

### Paso 2: Crear Web Service
1. En Render Dashboard → "New +" → "Web Service"
2. Conecta tu repositorio
3. Configuración:
   - **Name**: `app-auditorias`
   - **Region**: Oregon
   - **Branch**: main
   - **Root Directory**: (dejar vacío)
   - **Runtime**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### Paso 3: Variables de Entorno
Agregar en "Environment":
```
SECRET_KEY=<genera_una_clave_de_64_caracteres>
DATABASE_URL=<pega_la_internal_database_url>
DEBUG=False
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Para generar SECRET_KEY:
```python
import secrets
print(secrets.token_urlsafe(64))
```

### Paso 4: Deploy
- Click "Create Web Service"
- Esperar ~5-10 minutos

---

## ✅ Verificación Post-Despliegue

### 1. Verificar que el servicio esté corriendo
- URL: `https://app-auditorias.onrender.com`
- Debe mostrar la página de login

### 2. Verificar la API
- URL: `https://app-auditorias.onrender.com/docs` (solo si DEBUG=True)
- Debe mostrar la documentación de FastAPI

### 3. Crear Usuario Administrador Inicial
Conectarse a la base de datos y ejecutar:
```sql
-- Usar el shell de Render o conectarse con psql
INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, creado_en)
VALUES (
  'Admin',
  'admin@empresa.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ3K3m', -- password: admin123
  'administrador',
  NOW()
);
```

O usar Python:
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("tu_contraseña_segura"))
```

### 4. Probar Login
- Ir a `https://app-auditorias.onrender.com`
- Login con las credenciales creadas
- Verificar que cargue el dashboard

---

## 🔧 Troubleshooting

### Error: "Application failed to respond"
- Verificar logs en Render Dashboard
- Asegurarse de que `DATABASE_URL` esté configurada
- Verificar que las migraciones se ejecutaron: `alembic upgrade head`

### Error: "Module not found"
- Verificar que `requirements.txt` esté actualizado
- Rebuild del servicio

### Error: Frontend no carga
- Verificar que `frontend-app/dist` se creó durante el build
- Verificar logs de npm build

### Error: WebSocket no conecta
- Verificar que la URL use `wss://` en producción
- Verificar que el token JWT sea válido

### Base de datos vacía
- Ejecutar migraciones manualmente:
```bash
# En el shell de Render
alembic upgrade head
```

---

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
# En Render Dashboard → tu servicio → Logs
```

### Métricas
- CPU, Memoria, Requests en Render Dashboard

### Alertas
- Configurar en Render Dashboard → Settings → Notifications

---

## 🔄 Actualizaciones

### Deploy Automático
- Cada `git push` a `main` desplegará automáticamente

### Deploy Manual
- En Render Dashboard → tu servicio → "Manual Deploy" → "Deploy latest commit"

### Rollback
- En Render Dashboard → tu servicio → "Rollback" → seleccionar versión anterior

---

## 🔐 Seguridad Post-Despliegue

### 1. Rotar SECRET_KEY
Si la clave fue comprometida:
```bash
# Generar nueva clave
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Actualizar en Render Dashboard → Environment
```

### 2. Configurar HTTPS
- Render proporciona HTTPS automáticamente
- Verificar que `Strict-Transport-Security` esté en headers

### 3. Backup de Base de Datos
- Render Free tier: backups automáticos por 7 días
- Para backups manuales: usar `pg_dump`

### 4. Monitorear Rate Limiting
- Verificar logs para intentos de fuerza bruta
- Ajustar límites en `backend/middleware/security.py` si es necesario

---

## 📝 Notas Importantes

1. **Free Tier Limitations**:
   - El servicio se "duerme" después de 15 minutos de inactividad
   - Primera request después de dormir tarda ~30 segundos
   - 750 horas/mes de uptime

2. **Base de Datos**:
   - PostgreSQL Free: 1GB de almacenamiento
   - Backups por 7 días
   - Conexiones limitadas

3. **Build Time**:
   - Primera build: ~10 minutos
   - Builds subsecuentes: ~5 minutos (con cache)

4. **Dominio Personalizado**:
   - Configurar en Render Dashboard → Settings → Custom Domain
   - Agregar el dominio a `TrustedHostMiddleware` en `backend/main.py`

---

## 🆘 Soporte

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev

---

**¡Listo para producción! 🎉**
