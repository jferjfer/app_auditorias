# 🚀 Guía de Despliegue en Render

## ⚙️ Variables de Entorno Requeridas

En el dashboard de Render, agrega estas variables:

```bash
# OBLIGATORIAS
SECRET_KEY=<genera_una_clave_segura>
DATABASE_URL=<url_de_postgresql_render>
DEBUG=False
ACCESS_TOKEN_EXPIRE_MINUTES=30

# IMPORTANTE PARA CORS
PRODUCTION_URL=https://tu-app.onrender.com
```

## 🔑 Generar SECRET_KEY

```python
# Ejecuta esto en Python para generar una clave segura
import secrets
print(secrets.token_urlsafe(64))
```

## 📋 Checklist de Despliegue

### 1. Configurar Variables de Entorno
- [ ] `SECRET_KEY` - Clave única y segura
- [ ] `DATABASE_URL` - URL de PostgreSQL de Render
- [ ] `DEBUG=False` - Desactivar modo debug
- [ ] `PRODUCTION_URL` - URL completa de tu app (ej: `https://app-auditorias.onrender.com`)

### 2. Verificar CORS
Después del despliegue, verifica que CORS funciona:

```bash
# Debe retornar el header Access-Control-Allow-Origin
curl -I https://tu-app.onrender.com/api/audits/ \
  -H "Origin: https://tu-app.onrender.com" \
  -H "Authorization: Bearer <token>"
```

### 3. Verificar Seguridad
```bash
# Verificar headers de seguridad
curl -I https://tu-app.onrender.com/api/audits/

# Debe incluir:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

### 4. Probar Rate Limiting
```bash
# Intentar 6 logins rápidos
for i in {1..6}; do
  curl -X POST https://tu-app.onrender.com/api/auth/login \
    -d "username=test&password=wrong"
done
# El 6to debe retornar 429 (Too Many Requests)
```

## 🔧 Troubleshooting

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Causa**: Variable `PRODUCTION_URL` no configurada o incorrecta

**Solución**:
1. Ve a Render Dashboard > tu servicio > Environment
2. Agrega: `PRODUCTION_URL=https://tu-app.onrender.com`
3. Redeploy

### Error: "Trusted host header"

**Causa**: TrustedHostMiddleware bloqueando el dominio

**Solución**: Ya está configurado para `*.onrender.com`, debe funcionar automáticamente

### Error: Rate limiting muy agresivo

**Causa**: Múltiples usuarios detrás del mismo proxy/NAT

**Solución**: Ajustar límites en `backend/middleware/security.py`:
```python
# Cambiar de 100 a 200 requests/min
if entry["count"] > 200:  # Era 100
```

## 🌐 URLs Importantes

Después del despliegue:

- **Frontend**: `https://tu-app.onrender.com`
- **API Docs**: `https://tu-app.onrender.com/docs` (solo si DEBUG=True)
- **Health Check**: `https://tu-app.onrender.com/api/users/me/`

## 🔒 Seguridad en Producción

### ✅ Activado Automáticamente
- Rate limiting (100 req/min global, 5 req/min login)
- Headers de seguridad HTTP
- CORS restrictivo
- Validación de archivos Excel
- Contraseñas fuertes obligatorias
- TrustedHostMiddleware (solo dominios .onrender.com)

### ⚠️ Configurar Manualmente
- [ ] Cambiar `SECRET_KEY` por una única
- [ ] Configurar `PRODUCTION_URL` correctamente
- [ ] Verificar que `DEBUG=False`
- [ ] Configurar backups de base de datos
- [ ] Monitorear logs de seguridad

## 📊 Monitoreo

### Logs a Revisar
```bash
# Ver logs en Render Dashboard
# Buscar estos patrones:

# Rate limiting activado
"429 Too Many Requests"

# Intentos de login fallidos
"Credenciales inválidas"
"Demasiados intentos"

# Archivos rechazados
"Archivo muy grande"
"Archivo Excel inválido"

# Contraseñas débiles
"La contraseña debe tener"
```

## 🚨 Alertas Recomendadas

Configura alertas en Render para:
- Más de 10 errores 429 en 5 minutos
- Más de 20 intentos de login fallidos en 1 hora
- Uso de CPU > 80%
- Uso de memoria > 90%

## 📞 Soporte

Si tienes problemas:
1. Verifica variables de entorno
2. Revisa logs en Render Dashboard
3. Prueba endpoints con curl
4. Verifica que `PRODUCTION_URL` coincida exactamente con tu URL

---

**Última actualización**: 2024
