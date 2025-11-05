# ⚡ Comandos Rápidos

## 🚀 Deploy

```bash
# Verificar que todo esté listo
python verify_deploy.py

# Commit y push
git add .
git commit -m "Deploy: Production ready"
git push origin main
```

## 🔑 Generar SECRET_KEY

```python
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## 🔐 Hash de Contraseña

```python
python -c "from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt']); print(pwd_context.hash('tu_contraseña'))"
```

## 👤 Crear Admin

```bash
# Opción 1: Script interactivo
python create_admin.py

# Opción 2: SQL directo
# Conectar a la BD y ejecutar:
INSERT INTO usuarios (nombre, correo, contrasena_hash, rol, creado_en)
VALUES ('Admin', 'admin@empresa.com', '<hash>', 'administrador', NOW());
```

## 🗄️ Migraciones

```bash
# Ver estado actual
alembic current

# Ver historial
alembic history

# Aplicar migraciones
alembic upgrade head

# Crear nueva migración
alembic revision --autogenerate -m "descripcion"

# Rollback
alembic downgrade -1
```

## 🧪 Testing Local

```bash
# Activar entorno virtual
.\venv\Scripts\activate.bat

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn backend.main:app --reload

# Ejecutar tests
pytest
```

## 🎨 Frontend

```bash
cd frontend-app

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

## 📦 Dependencias

```bash
# Actualizar requirements.txt
pip freeze > requirements.txt

# Verificar dependencias desactualizadas
pip list --outdated

# Actualizar dependencia específica
pip install --upgrade nombre_paquete
```

## 🔍 Debugging

```bash
# Ver logs de Render
# Render Dashboard → tu servicio → Logs

# Conectar a BD de producción
# Usar la External Database URL de Render

# Shell de Render
# Render Dashboard → tu servicio → Shell

# Ver variables de entorno
# Render Dashboard → tu servicio → Environment
```

## 🔄 Rollback

```bash
# En Render Dashboard
# tu servicio → Rollback → seleccionar versión

# O forzar redeploy de un commit específico
git revert HEAD
git push origin main
```

## 📊 Backup de BD

```bash
# Desde Render Shell
pg_dump $DATABASE_URL > backup.sql

# Desde local (con DATABASE_URL de producción)
pg_dump "postgresql://user:pass@host/db" > backup.sql

# Restaurar
psql $DATABASE_URL < backup.sql
```

## 🧹 Limpieza

```bash
# Limpiar cache de Python
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Limpiar node_modules
cd frontend-app
rm -rf node_modules
npm install

# Limpiar builds
rm -rf frontend-app/dist
```

## 🔐 Rotar Credenciales

```bash
# 1. Generar nueva SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(64))"

# 2. Actualizar en Render Dashboard
# Environment → SECRET_KEY → Edit → Save

# 3. Redeploy
# Manual Deploy → Deploy latest commit
```

## 📈 Monitoreo

```bash
# Ver métricas en tiempo real
# Render Dashboard → tu servicio → Metrics

# Configurar alertas
# Settings → Notifications → Add notification

# Health check
curl https://app-auditorias.onrender.com/api/users/
# Debe retornar 401 (sin auth) = servicio funcionando
```

## 🐛 Troubleshooting Rápido

```bash
# Servicio no responde
# 1. Verificar logs
# 2. Verificar DATABASE_URL
# 3. Redeploy manual

# Frontend no carga
# 1. Verificar que dist/ existe en logs de build
# 2. Verificar ruta en main.py
# 3. Rebuild

# WebSocket no conecta
# 1. Verificar que use wss:// en producción
# 2. Verificar token JWT
# 3. Verificar logs de conexión

# Error de migraciones
alembic upgrade head
```

## 🎯 URLs Importantes

```
Producción: https://app-auditorias.onrender.com
API Docs: https://app-auditorias.onrender.com/docs (solo si DEBUG=True)
Render Dashboard: https://dashboard.render.com
GitHub Repo: https://github.com/tu-usuario/app_auditorias
```

## 📝 Notas

- Todos los comandos asumen que estás en el directorio raíz del proyecto
- Para Windows, usar `.\venv\Scripts\activate.bat` en lugar de `source venv/bin/activate`
- Para comandos de shell en Render, usar el Shell integrado en el Dashboard
- Los backups automáticos de Render Free tier duran 7 días
