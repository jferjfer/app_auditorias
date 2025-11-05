# 🔐 Guía de Seguridad

## ✅ Implementaciones de Seguridad

### 1. **Autenticación JWT**
- SECRET_KEY generada automáticamente (64 bytes)
- Tokens con expiración de 30 minutos
- Claim `iat` (issued at) para tracking

### 2. **Rate Limiting**
- 100 requests/minuto por IP
- Protección contra fuerza bruta y DDoS

### 3. **Security Headers**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)

### 4. **CORS Restrictivo**
- Solo orígenes permitidos
- Métodos HTTP específicos
- Headers limitados

### 5. **Input Sanitization**
- Validación de SKUs (alfanumérico, max 50 chars)
- Validación de emails (regex)
- Sanitización de strings (SQL injection patterns)

### 6. **WebSocket Seguro**
- WSS en producción (HTTPS)
- Autenticación por token
- Validación de usuario en cada conexión

### 7. **Trusted Hosts**
- Solo hosts permitidos
- Protección contra host header attacks

## 🚨 Configuración Obligatoria en Producción

### 1. SECRET_KEY
```bash
# Generar clave segura
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Establecer en variables de entorno
export SECRET_KEY="tu_clave_generada_aqui"
```

### 2. HTTPS
- Usar certificado SSL/TLS válido
- Redirigir HTTP → HTTPS
- WebSockets en WSS

### 3. Base de Datos
- Usar PostgreSQL en producción
- Credenciales en variables de entorno
- Conexiones SSL

### 4. Logs
- No registrar información sensible
- Monitorear intentos de acceso fallidos
- Alertas de rate limiting

## 🔍 Auditoría de Seguridad

### Checklist Pre-Producción
- [ ] SECRET_KEY única y segura
- [ ] HTTPS habilitado
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo
- [ ] Logs sanitizados
- [ ] Base de datos con SSL
- [ ] Backups automáticos
- [ ] Monitoreo de seguridad

## 📞 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, repórtala de forma responsable.

## 🛡️ Mejores Prácticas

1. **Nunca** commitear `.env` con credenciales reales
2. **Rotar** SECRET_KEY periódicamente
3. **Actualizar** dependencias regularmente
4. **Monitorear** logs de seguridad
5. **Limitar** permisos de base de datos
6. **Usar** contraseñas fuertes (min 12 caracteres)
7. **Habilitar** 2FA para administradores (futuro)
