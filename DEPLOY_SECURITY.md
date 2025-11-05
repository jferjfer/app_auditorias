# 🔐 Configuración de Seguridad en Render

## ✅ CREDENCIALES ROTADAS

### Nueva SECRET_KEY generada:
```
iMnEtubnL6JOJUed8hZvZYP5ieCO6eMhi_aPvXIueCB_4TiJ7xXM1KbpEgD1Y61ZFliHOoFbhiNQV_hqoAqv_w
```

---

## 📋 PASOS PARA ACTUALIZAR EN RENDER

### 1. Ir a Render Dashboard
https://dashboard.render.com

### 2. Seleccionar tu servicio "app-auditorias"

### 3. Ir a "Environment" → "Environment Variables"

### 4. Actualizar variables:

```bash
SECRET_KEY=iMnEtubnL6JOJUed8hZvZYP5ieCO6eMhi_aPvXIueCB_4TiJ7xXM1KbpEgD1Y61ZFliHOoFbhiNQV_hqoAqv_w
DEBUG=False
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Cambiar contraseña de PostgreSQL:
- Ir a tu base de datos PostgreSQL en Render
- Settings → Reset Password
- Copiar nueva DATABASE_URL
- Actualizar variable DATABASE_URL en el servicio

### 6. Hacer redeploy:
- Manual Deploy → Deploy latest commit

---

## ✅ ARCHIVOS PROTEGIDOS

- ✅ `.env` eliminado del tracking de Git
- ✅ `auditorias.db` eliminado
- ✅ `_temp_alembic.db` eliminado
- ✅ `.gitignore` actualizado
- ✅ `uploads/` protegido (solo .gitkeep)

---

## 🔒 VERIFICACIÓN POST-DEPLOY

1. Verificar que la app funciona con nuevas credenciales
2. Probar login
3. Verificar WebSockets
4. Confirmar que /docs está deshabilitado en producción
5. Verificar que uploads/ requiere autenticación

---

## ⚠️ IMPORTANTE

**NO COMMITEAR ESTE ARCHIVO CON LA SECRET_KEY**

Después de actualizar Render, elimina la SECRET_KEY de este archivo.
