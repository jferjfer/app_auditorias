# ✅ Checklist Pre-Despliegue

## 🔒 Seguridad

- [x] SECRET_KEY rotada y no está en el repositorio
- [x] .env agregado a .gitignore
- [x] DEBUG=False en producción
- [x] Rate limiting configurado
- [x] CSRF protection implementado
- [x] Security headers configurados
- [x] Uploads protegidos con autenticación
- [x] Input sanitization implementado
- [x] Password hashing con bcrypt
- [x] JWT con expiración configurada

## 📦 Dependencias

- [x] requirements.txt actualizado
- [x] package.json actualizado
- [x] Versiones de dependencias sin vulnerabilidades conocidas

## 🗄️ Base de Datos

- [x] Migraciones de Alembic creadas
- [x] DATABASE_URL configurada para PostgreSQL
- [x] Modelos sincronizados con esquemas
- [x] Timezone handling (UTC → Bogotá)

## 🎨 Frontend

- [x] Build de producción funciona (`npm run build`)
- [x] API_BASE_URL configurada correctamente
- [x] WebSocket URLs dinámicas (ws/wss)
- [x] Rutas protegidas con ProtectedRoute
- [x] Toast notifications implementadas
- [x] Responsive design completo

## 🔧 Backend

- [x] FastAPI configurado para producción
- [x] CORS configurado con orígenes permitidos
- [x] WebSocket endpoints protegidos
- [x] Endpoints de API documentados
- [x] Error handling implementado
- [x] Logging configurado

## 📝 Archivos de Deploy

- [x] build.sh creado y ejecutable
- [x] render.yaml configurado
- [x] .gitignore actualizado
- [x] README.md actualizado

## 🧪 Testing

- [ ] Tests unitarios ejecutados
- [ ] Tests de integración ejecutados
- [ ] Prueba de carga de archivos Excel
- [ ] Prueba de escaneo de productos
- [ ] Prueba de colaboración en tiempo real
- [ ] Prueba de generación de reportes

## 📊 Monitoreo

- [ ] Logs configurados
- [ ] Métricas de rendimiento
- [ ] Alertas configuradas

## 🚀 Deploy

- [ ] Repositorio pusheado a GitHub
- [ ] Servicio creado en Render
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Migraciones ejecutadas
- [ ] Usuario admin creado
- [ ] Login funciona
- [ ] WebSocket conecta
- [ ] Carga de archivos funciona
- [ ] Reportes se generan

## 📱 Post-Deploy

- [ ] Verificar HTTPS activo
- [ ] Verificar certificado SSL
- [ ] Probar desde móvil
- [ ] Probar escaneo con cámara
- [ ] Verificar notificaciones en tiempo real
- [ ] Backup de base de datos configurado

---

## 🎯 Comandos Útiles

### Verificar build local
```bash
cd frontend-app
npm install
npm run build
cd ..
```

### Ejecutar migraciones
```bash
alembic upgrade head
```

### Generar SECRET_KEY
```python
import secrets
print(secrets.token_urlsafe(64))
```

### Hash de contraseña
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("tu_contraseña"))
```

### Verificar dependencias
```bash
pip list --outdated
npm outdated
```

---

**Fecha de último check**: ___________
**Responsable**: ___________
**Versión**: 1.0.0
