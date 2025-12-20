# ⚡ Inicio Rápido - 5 Minutos

## 🎯 Objetivo
Ejecutar el proyecto localmente conectado a la base de datos de Render.

## 📋 Pasos

### 1️⃣ Instalar Dependencias (Solo primera vez)

```bash
# Backend
python -m venv venv
.\venv\Scripts\activate.bat
pip install -r requirements.txt

# Frontend
cd frontend-app
npm install
cd ..
```

### 2️⃣ Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
copy .env.example .env
```

**Editar `.env` con estos valores:**

```env
SECRET_KEY=iMnEtubnL6JOJUed8hZvZYP5ieCO6eMhi_aPvXIueCB_4TiJ7xXM1KbpEgD1Y61ZFliHOoFbhiNQV_hqoAqv_w
DATABASE_URL=postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require
DEBUG=True
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3️⃣ Verificar Configuración (Opcional)

```bash
python verify_setup.py
```

### 4️⃣ Ejecutar Backend

```bash
# Terminal 1
.\venv\Scripts\activate.bat
uvicorn backend.main:app --reload
```

✅ Backend: http://127.0.0.1:8000
✅ API Docs: http://127.0.0.1:8000/docs

### 5️⃣ Ejecutar Frontend

```bash
# Terminal 2
cd frontend-app
npm run dev
```

✅ Frontend: http://localhost:3000

## 🎉 ¡Listo!

Ahora puedes:
- Iniciar sesión con tus credenciales
- Crear auditorías
- Escanear productos
- Ver reportes

## 🔄 Próximas Veces

```bash
# Terminal 1 - Backend
.\venv\Scripts\activate.bat
uvicorn backend.main:app --reload

# Terminal 2 - Frontend
cd frontend-app
npm run dev
```

## ⚠️ Importante

- ✅ Tu `.env` local NO se sube a Git
- ✅ Estás usando la BD de producción (Render)
- ✅ Los cambios que hagas afectarán datos reales
- ✅ Render usa sus propias variables de entorno

## 🐛 Problemas Comunes

### Puerto 8000 ocupado
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Error de conexión a BD
- Verifica que tengas internet
- Verifica que la URL de la BD sea correcta en `.env`

### Error "No module named 'backend'"
```bash
# Asegúrate de estar en la raíz del proyecto
cd app_auditorias
python -m uvicorn backend.main:app --reload
```

## 📚 Más Información

- **Configuración detallada**: [LOCAL_SETUP.md](LOCAL_SETUP.md)
- **Documentación completa**: [README.md](README.md)
- **Seguridad**: [SECURITY_REPORT.md](SECURITY_REPORT.md)
