# 🚀 DESPLEGAR AHORA - Guía Rápida

## ✅ Verificación Completada

Todos los checks pasaron exitosamente. El sistema está listo para producción.

---

## 📋 Pasos para Desplegar (10 minutos)

### 1️⃣ Commit y Push (2 minutos)

```bash
# Asegúrate de estar en el directorio del proyecto
cd c:\app_auditorias

# Agregar todos los archivos
git add .

# Commit
git commit -m "Deploy: Sistema de Auditorias v1.0 - Production Ready"

# Push a GitHub
git push origin main
```

---

### 2️⃣ Crear Servicio en Render (5 minutos)

#### A. Ir a Render Dashboard
1. Abre https://dashboard.render.com
2. Login con tu cuenta

#### B. Opción Automática (RECOMENDADA)
1. Click en **"New +"** → **"Blueprint"**
2. Conecta tu repositorio de GitHub
3. Render detectará automáticamente `render.yaml`
4. Click en **"Apply"**
5. ✅ ¡Listo! Render creará:
   - Base de datos PostgreSQL
   - Web Service con Python
   - Variables de entorno automáticas

#### C. Opción Manual (si prefieres control total)

**Paso 1: Crear Base de Datos**
1. Click en **"New +"** → **"PostgreSQL"**
2. Configuración:
   - Name: `app-auditorias-db`
   - Database: `app_auditorias_b5oy`
   - User: `app_auditorias_b5oy_user`
   - Region: **Oregon**
   - Plan: **Free**
3. Click **"Create Database"**
4. **IMPORTANTE**: Copia la **"Internal Database URL"**

**Paso 2: Crear Web Service**
1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name**: `app-auditorias`
   - **Region**: Oregon
   - **Branch**: main
   - **Root Directory**: (dejar vacío)
   - **Runtime**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

**Paso 3: Variables de Entorno**

Click en **"Advanced"** → **"Add Environment Variable"**

Agregar estas 4 variables:

```
SECRET_KEY = <generar_nueva_clave>
DATABASE_URL = <pegar_internal_database_url>
DEBUG = False
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

**Para generar SECRET_KEY**, ejecuta en tu terminal:
```python
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

4. Click **"Create Web Service"**

---

### 3️⃣ Esperar el Build (5-10 minutos)

Render ejecutará automáticamente:
1. ✅ Instalar Python dependencies
2. ✅ Instalar Node.js 18
3. ✅ Build del frontend React
4. ✅ Ejecutar migraciones de Alembic
5. ✅ Iniciar servidor uvicorn

**Monitorear el progreso:**
- Ve a tu servicio en Render Dashboard
- Click en **"Logs"** para ver el progreso en tiempo real

---

### 4️⃣ Verificar Despliegue (2 minutos)

#### A. Verificar que el servicio esté activo
1. En Render Dashboard, verifica que el estado sea **"Live"** (verde)
2. Copia la URL del servicio (ej: `https://app-auditorias.onrender.com`)

#### B. Probar el frontend
1. Abre la URL en tu navegador
2. Deberías ver la página de login

#### C. Verificar la API
```bash
# Abrir en navegador (solo si DEBUG=True)
https://app-auditorias.onrender.com/docs
```

---

### 5️⃣ Crear Usuario Administrador (3 minutos)

#### Opción A: Usando el Shell de Render
1. En Render Dashboard → tu servicio → **"Shell"**
2. Ejecutar:
```bash
python create_admin.py
```
3. Seguir las instrucciones en pantalla

#### Opción B: Desde tu computadora
1. Actualizar `.env` local con la DATABASE_URL de producción
2. Ejecutar:
```bash
python create_admin.py
```

#### Opción C: SQL Directo
1. En Render Dashboard → tu base de datos → **"Connect"** → **"External Connection"**
2. Usar un cliente PostgreSQL (DBeaver, pgAdmin, etc.)
3. Ejecutar:
```sql
-- Generar hash de contraseña primero con:
-- python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('tu_contraseña'))"

INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, creado_en)
VALUES (
  'Administrador',
  'admin@empresa.com',
  '$2b$12$...', -- pegar el hash generado
  'administrador',
  NOW()
);
```

---

### 6️⃣ Probar el Sistema (5 minutos)

#### Login
1. Ir a `https://app-auditorias.onrender.com`
2. Login con las credenciales del admin
3. ✅ Deberías ver el Dashboard de Administrador

#### Crear Usuario Auditor
1. En el dashboard de admin → **"Gestión de Usuarios"**
2. Crear un usuario con rol **"auditor"**
3. Logout y login con el nuevo usuario

#### Probar Funcionalidades
1. **Cargar archivo Excel**: Subir una orden de traslado
2. **Iniciar auditoría**: Click en "Iniciar"
3. **Escanear productos**: Probar el escaneo de SKUs
4. **WebSocket**: Verificar notificaciones en tiempo real
5. **Finalizar auditoría**: Completar y ver % de cumplimiento

---

## 🎉 ¡Despliegue Completado!

Tu sistema está ahora en producción en:
```
https://app-auditorias.onrender.com
```

---

## 📊 Monitoreo Post-Despliegue

### Logs en Tiempo Real
```
Render Dashboard → tu servicio → Logs
```

### Métricas
- CPU, Memoria, Requests
- Disponible en Render Dashboard → Metrics

### Alertas
- Configurar en Settings → Notifications
- Email cuando el servicio falla o se reinicia

---

## 🔄 Actualizaciones Futuras

### Deploy Automático
Cada vez que hagas `git push` a `main`, Render desplegará automáticamente.

### Deploy Manual
```
Render Dashboard → tu servicio → Manual Deploy → Deploy latest commit
```

### Rollback
```
Render Dashboard → tu servicio → Rollback → seleccionar versión anterior
```

---

## ⚠️ Notas Importantes

### Free Tier
- El servicio se "duerme" después de 15 minutos de inactividad
- Primera request después de dormir tarda ~30 segundos
- 750 horas/mes de uptime (suficiente para uso normal)

### Base de Datos
- PostgreSQL Free: 1GB de almacenamiento
- Backups automáticos por 7 días
- Conexiones limitadas (suficiente para Free tier)

### HTTPS
- Render proporciona HTTPS automáticamente
- Certificado SSL renovado automáticamente

---

## 🆘 Troubleshooting

### "Application failed to respond"
```bash
# Verificar logs en Render Dashboard
# Verificar que DATABASE_URL esté configurada
# Verificar que las migraciones se ejecutaron
```

### Frontend no carga
```bash
# Verificar logs de build
# Buscar errores en "npm run build"
# Verificar que dist/ se creó
```

### WebSocket no conecta
```bash
# Verificar que use wss:// en producción
# Verificar token JWT válido
# Verificar logs del servidor
```

### Error de migraciones
```bash
# En Render Shell:
alembic upgrade head
```

---

## 📞 Soporte

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

## ✅ Checklist Final

- [ ] Código pusheado a GitHub
- [ ] Servicio creado en Render
- [ ] Build completado exitosamente
- [ ] Servicio en estado "Live"
- [ ] Frontend carga correctamente
- [ ] Usuario admin creado
- [ ] Login funciona
- [ ] Carga de archivos funciona
- [ ] Escaneo de productos funciona
- [ ] WebSocket conecta
- [ ] Notificaciones en tiempo real funcionan
- [ ] Reportes se generan correctamente

---

**¡Felicidades! Tu sistema está en producción! 🎊**

**URL de Producción**: https://app-auditorias.onrender.com

**Próximos pasos sugeridos**:
1. Configurar dominio personalizado (opcional)
2. Configurar alertas de monitoreo
3. Crear backups adicionales de la base de datos
4. Documentar credenciales de admin de forma segura
5. Capacitar a los usuarios finales

---

**Versión**: 1.0.0  
**Fecha**: 2024  
**Estado**: ✅ DEPLOYED
