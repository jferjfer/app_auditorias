# 🧪 Pruebas de Seguridad - Guía Práctica

## 🎯 Objetivo
Verificar que todas las protecciones de seguridad funcionan correctamente.

---

## ✅ TEST 1: Rate Limiting en Login

### Objetivo
Verificar que después de 5 intentos fallidos, el sistema bloquea por 1 minuto.

### Pasos
```bash
# Ejecutar este script
for i in {1..6}; do
  echo "=== Intento $i ==="
  curl -X POST http://127.0.0.1:8000/api/auth/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=test@test.com&password=wrongpassword"
  echo ""
  sleep 1
done
```

### Resultado Esperado
- Intentos 1-5: `{"detail":"Credenciales inválidas"}`
- Intento 6: `{"detail":"Demasiados intentos. Intenta en 1 minuto"}`

---

## ✅ TEST 2: Contraseña Débil

### Objetivo
Verificar que solo se aceptan contraseñas fuertes.

### Pasos
1. Login como administrador
2. Intentar crear usuario con contraseña débil:

```bash
TOKEN="<tu_token_admin>"

# Test 1: Sin mayúscula (debe fallar)
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "correo":"test1@test.com",
    "nombre":"Test User",
    "contrasena":"password123",
    "rol":"auditor"
  }'

# Test 2: Sin número (debe fallar)
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "correo":"test2@test.com",
    "nombre":"Test User",
    "contrasena":"Password",
    "rol":"auditor"
  }'

# Test 3: Muy corta (debe fallar)
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "correo":"test3@test.com",
    "nombre":"Test User",
    "contrasena":"Pass1",
    "rol":"auditor"
  }'

# Test 4: Contraseña fuerte (debe funcionar)
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "correo":"test4@test.com",
    "nombre":"Test User",
    "contrasena":"Password123",
    "rol":"auditor"
  }'
```

### Resultado Esperado
- Tests 1-3: Error con mensaje específico
- Test 4: Usuario creado exitosamente

---

## ✅ TEST 3: Validación de Archivos Excel

### Objetivo
Verificar que solo se aceptan archivos Excel válidos.

### Pasos

#### 3.1: Archivo muy grande
```bash
# Crear archivo de 15MB (excede límite de 10MB)
dd if=/dev/zero of=huge.xlsx bs=1M count=15

# Intentar subir (debe fallar)
curl -X POST http://127.0.0.1:8000/api/audits/upload-multiple-files \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@huge.xlsx"
```

#### 3.2: Archivo con extensión falsa
```bash
# Crear ejecutable y renombrarlo
echo "malware content" > virus.exe
mv virus.exe fake.xlsx

# Intentar subir (debe fallar)
curl -X POST http://127.0.0.1:8000/api/audits/upload-multiple-files \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@fake.xlsx"
```

#### 3.3: Demasiados archivos
```bash
# Crear 11 archivos (excede límite de 10)
for i in {1..11}; do
  echo "test" > file$i.xlsx
done

# Intentar subir todos (debe fallar)
curl -X POST http://127.0.0.1:8000/api/audits/upload-multiple-files \
  -H "Authorization: Bearer $TOKEN" \
  $(for i in {1..11}; do echo "-F files=@file$i.xlsx"; done)
```

### Resultado Esperado
- Todos deben fallar con mensajes descriptivos

---

## ✅ TEST 4: Sanitización de OT

### Objetivo
Verificar que caracteres peligrosos son rechazados.

### Pasos
```bash
TOKEN="<tu_token>"

# Test 1: SQL Injection (debe fallar)
curl -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:8000/api/audits/search-by-ot/VE123';DROP%20TABLE--"

# Test 2: XSS (debe fallar)
curl -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:8000/api/audits/search-by-ot/<script>alert('xss')</script>"

# Test 3: OT válida (debe funcionar)
curl -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:8000/api/audits/search-by-ot/VE123"
```

### Resultado Esperado
- Tests 1-2: `{"detail":"Número de OT inválido"}`
- Test 3: Resultado de búsqueda o 404

---

## ✅ TEST 5: Rate Limiting Global

### Objetivo
Verificar límite de 100 requests por minuto.

### Pasos
```bash
# Script para hacer 101 requests rápidos
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer $TOKEN" \
    http://127.0.0.1:8000/api/audits/
done
```

### Resultado Esperado
- Requests 1-100: `200`
- Request 101: `429` (Too Many Requests)

---

## ✅ TEST 6: Headers de Seguridad

### Objetivo
Verificar que los headers de seguridad están presentes.

### Pasos
```bash
curl -I http://127.0.0.1:8000/api/audits/ \
  -H "Authorization: Bearer $TOKEN"
```

### Resultado Esperado
Debe incluir estos headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-RateLimit-Limit: 100
X-RateLimit-Remaining: <número>
```

---

## ✅ TEST 7: IDOR Protection

### Objetivo
Verificar que un auditor no puede ver auditorías de otros.

### Pasos
1. Login como auditor1 (guarda su token)
2. Login como auditor2 (guarda su token)
3. Auditor1 crea una auditoría (guarda el ID)
4. Auditor2 intenta acceder a esa auditoría:

```bash
TOKEN_AUDITOR2="<token_auditor2>"
AUDIT_ID_AUDITOR1="<id_auditoria_auditor1>"

curl -H "Authorization: Bearer $TOKEN_AUDITOR2" \
  http://127.0.0.1:8000/api/audits/$AUDIT_ID_AUDITOR1
```

### Resultado Esperado
- `{"detail":"Auditoría no encontrada o sin acceso."}`

---

## ✅ TEST 8: CORS Protection

### Objetivo
Verificar que solo orígenes permitidos pueden hacer requests.

### Pasos
```bash
# Desde origen no permitido (debe fallar)
curl -H "Origin: https://malicious-site.com" \
  -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/audits/

# Desde origen permitido (debe funcionar)
curl -H "Origin: http://localhost:5173" \
  -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/audits/
```

### Resultado Esperado
- Primer request: Sin header `Access-Control-Allow-Origin`
- Segundo request: Con header `Access-Control-Allow-Origin: http://localhost:5173`

---

## ✅ TEST 9: Timing Attack Protection

### Objetivo
Verificar que el tiempo de respuesta es constante para usuarios existentes y no existentes.

### Pasos
```bash
# Medir tiempo para usuario existente
time curl -X POST http://127.0.0.1:8000/api/auth/login \
  -d "username=admin@admin.com&password=wrong"

# Medir tiempo para usuario inexistente
time curl -X POST http://127.0.0.1:8000/api/auth/login \
  -d "username=noexiste@test.com&password=wrong"
```

### Resultado Esperado
- Ambos deben tomar aproximadamente el mismo tiempo (~0.5 segundos)

---

## 📊 Checklist de Seguridad

Marca cada test completado:

- [ ] TEST 1: Rate Limiting en Login
- [ ] TEST 2: Contraseña Débil
- [ ] TEST 3: Validación de Archivos Excel
- [ ] TEST 4: Sanitización de OT
- [ ] TEST 5: Rate Limiting Global
- [ ] TEST 6: Headers de Seguridad
- [ ] TEST 7: IDOR Protection
- [ ] TEST 8: CORS Protection
- [ ] TEST 9: Timing Attack Protection

---

## 🔧 Troubleshooting

### Error: "Token inválido"
- Genera un nuevo token haciendo login

### Error: "Connection refused"
- Verifica que el servidor esté corriendo: `uvicorn backend.main:app --reload`

### Error: "Module not found"
- Instala dependencias: `pip install -r requirements.txt`

---

## 📝 Notas

- Ejecuta estos tests en **ambiente de desarrollo**, nunca en producción
- Algunos tests pueden dejar datos de prueba en la BD
- Limpia la BD después de los tests: `alembic downgrade base && alembic upgrade head`
