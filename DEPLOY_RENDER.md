# 🚀 Guía de Despliegue en Render

## 📋 Configuración Actual

Tu backend FastAPI ya está desplegado en Render. Ahora vamos a servir el frontend React desde el mismo servicio.

---

## 🔧 Pasos para Desplegar

### **1. Verificar Archivos**

Asegúrate de tener estos archivos en tu repositorio:

```
app_auditorias/
├── build.sh                    # ✅ Actualizado para construir React
├── backend/
│   └── main.py                 # ✅ Modificado para servir frontend-react
├── frontend-app/               # ✅ Tu nuevo frontend React
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.production
└── frontend/                   # ⚠️ Frontend antiguo (backup)
```

---

### **2. Commit y Push**

```bash
git add .
git commit -m "feat: migrar frontend a React + Vite"
git push origin main
```

---

### **3. Configurar Render**

#### **Opción A: Desde el Dashboard de Render**

1. Ve a tu servicio en Render
2. **Settings** → **Build & Deploy**
3. Verificar:
   - **Build Command**: `./build.sh`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

#### **Opción B: Dejar que se auto-despliegue**

Render detectará los cambios y ejecutará `build.sh` automáticamente.

---

### **4. Verificar el Build**

En los logs de Render deberías ver:

```
==> Instalando dependencias Python...
==> Instalando Node.js y npm...
==> Construyendo frontend React...
==> Moviendo build al backend...
==> Build completado!
```

---

### **5. Probar la Aplicación**

Una vez desplegado:

1. Ir a: `https://app-auditorias.onrender.com`
2. Deberías ver el login de React
3. Iniciar sesión con tus credenciales
4. Verificar que todos los dashboards funcionen

---

## 🔍 Cómo Funciona

### **Flujo de Build:**

1. **Render ejecuta `build.sh`**
2. Instala dependencias Python
3. Instala Node.js 18
4. Construye frontend React (`npm run build`)
5. Mueve `/dist` a `/frontend-react`
6. FastAPI sirve `/frontend-react` en la ruta `/`

### **Flujo de Requests:**

```
Usuario → https://app-auditorias.onrender.com
         ↓
    FastAPI (backend/main.py)
         ↓
    /api/* → Routers de FastAPI
    /*     → StaticFiles (frontend-react/)
```

---

## 🐛 Troubleshooting

### **Error: npm not found**

El script `build.sh` instala Node.js automáticamente. Si falla:

1. Verificar que `build.sh` tenga permisos de ejecución:
   ```bash
   chmod +x build.sh
   ```

2. Verificar logs de Render para ver el error exacto

### **Error: frontend-react directory not found**

Si el build falla, FastAPI servirá el frontend antiguo (`/frontend`) como fallback.

Verificar en logs:
```
==> Moviendo build al backend...
```

### **Error: API calls failing (CORS)**

El frontend React usa rutas relativas (`/api/*`), así que no debería haber problemas de CORS.

Si hay errores, verificar en `backend/main.py`:
```python
allow_origins=[
    "https://app-auditorias.onrender.com",
]
```

### **Error: Página en blanco**

1. Abrir DevTools (F12)
2. Ver errores en Console
3. Verificar que los archivos JS/CSS se carguen correctamente
4. Verificar que `index.html` esté en `/frontend-react`

---

## 📊 Comparación de Opciones

### **Opción 1: Backend sirve Frontend (Actual)** ✅

**Ventajas:**
- Un solo servicio en Render (gratis)
- Sin problemas de CORS
- Más simple de mantener
- URLs limpias

**Desventajas:**
- Build más largo
- Requiere Node.js en el servidor

### **Opción 2: Frontend separado** ❌

**Ventajas:**
- Builds independientes
- Escalado separado

**Desventajas:**
- 2 servicios en Render (costo)
- Configuración CORS compleja
- Más difícil de mantener

---

## 🔄 Rollback (Si algo sale mal)

Si el nuevo frontend no funciona, puedes volver al anterior:

### **Método 1: Desde Git**
```bash
git revert HEAD
git push origin main
```

### **Método 2: Modificar main.py**
```python
# En backend/main.py, cambiar:
frontend_dir = "frontend"  # Forzar frontend antiguo
```

---

## ✅ Checklist de Despliegue

- [ ] `build.sh` actualizado
- [ ] `backend/main.py` modificado
- [ ] `frontend-app/.env.production` creado
- [ ] Commit y push a GitHub
- [ ] Render inicia build automático
- [ ] Verificar logs de build
- [ ] Probar login en producción
- [ ] Probar cada dashboard
- [ ] Probar carga de Excel
- [ ] Probar descarga de PDF/Excel

---

## 📝 Notas Importantes

1. **Primera vez**: El build puede tardar 5-10 minutos
2. **Builds siguientes**: 2-3 minutos (caché de npm)
3. **Free tier de Render**: El servicio se duerme después de 15 min de inactividad
4. **Base de datos**: Ya está configurada en PostgreSQL de Render

---

## 🎉 Resultado Final

Una vez desplegado tendrás:

✅ Frontend React moderno  
✅ Backend FastAPI  
✅ Base de datos PostgreSQL  
✅ Todo en un solo servicio de Render  
✅ HTTPS automático  
✅ Dominio: `app-auditorias.onrender.com`  

---

**¿Listo para desplegar?** 🚀

```bash
git add .
git commit -m "feat: migrar frontend a React + Vite"
git push origin main
```

Luego espera 5-10 minutos y visita: **https://app-auditorias.onrender.com**
