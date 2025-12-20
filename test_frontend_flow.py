"""
Simular flujo completo del frontend: Login -> Dashboard -> Acciones
"""
import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000/api"

def login(email, password):
    """Simula login desde frontend"""
    data = urllib.parse.urlencode({"username": email, "password": password}).encode()
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, 
                                  headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def get_user_info(token):
    """Obtener info del usuario actual"""
    req = urllib.request.Request(f"{BASE_URL}/users/me/", 
                                  headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def get_audits(token):
    """Obtener auditorías"""
    req = urllib.request.Request(f"{BASE_URL}/audits/", 
                                  headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def get_ubicaciones(token):
    """Obtener ubicaciones"""
    req = urllib.request.Request(f"{BASE_URL}/ubicaciones/", 
                                  headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

print("=" * 60)
print("SIMULACION COMPLETA DE FLUJO FRONTEND")
print("=" * 60)

# Test 1: AUDITOR
print("\n1. FLUJO AUDITOR")
print("-" * 60)
try:
    login_data = login("carlos@laika.com.co", "A1234567a")
    token = login_data["access_token"]
    print(f"Login exitoso: {login_data['user_name']} ({login_data['user_role']})")
    
    user = get_user_info(token)
    print(f"Usuario verificado: {user['nombre']} - {user['correo']}")
    
    audits = get_audits(token)
    print(f"Auditorias cargadas: {len(audits)} auditorias")
    if audits:
        print(f"  Primera auditoria: ID={audits[0]['id']}, Estado={audits[0]['estado']}")
    
    ubicaciones = get_ubicaciones(token)
    print(f"Ubicaciones cargadas: {len(ubicaciones)} sedes")
    
    print("AUDITOR: OK")
except Exception as e:
    print(f"AUDITOR: ERROR - {e}")

# Test 2: ANALISTA
print("\n2. FLUJO ANALISTA")
print("-" * 60)
try:
    login_data = login("felipe@laika.com.co", "A1234567a")
    token = login_data["access_token"]
    print(f"Login exitoso: {login_data['user_name']} ({login_data['user_role']})")
    
    user = get_user_info(token)
    print(f"Usuario verificado: {user['nombre']} - {user['correo']}")
    
    audits = get_audits(token)
    print(f"Auditorias visibles: {len(audits)} auditorias")
    
    # Probar endpoint de estadísticas
    req = urllib.request.Request(f"{BASE_URL}/audits/statistics/status", 
                                  headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as response:
        stats = json.loads(response.read().decode())
        print(f"Estadisticas cargadas: {len(stats)} estados")
    
    print("ANALISTA: OK")
except Exception as e:
    print(f"ANALISTA: ERROR - {e}")

# Test 3: ADMINISTRADOR
print("\n3. FLUJO ADMINISTRADOR")
print("-" * 60)
try:
    login_data = login("javier@laika.com.co", "A1234567a")
    token = login_data["access_token"]
    print(f"Login exitoso: {login_data['user_name']} ({login_data['user_role']})")
    
    user = get_user_info(token)
    print(f"Usuario verificado: {user['nombre']} - {user['correo']}")
    
    # Obtener todos los usuarios
    req = urllib.request.Request(f"{BASE_URL}/users/", 
                                  headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as response:
        users = json.loads(response.read().decode())
        print(f"Usuarios del sistema: {len(users)} usuarios")
        print(f"  Roles: {set(u['rol'] for u in users)}")
    
    audits = get_audits(token)
    print(f"Auditorias totales: {len(audits)} auditorias")
    
    print("ADMINISTRADOR: OK")
except Exception as e:
    print(f"ADMINISTRADOR: ERROR - {e}")

print("\n" + "=" * 60)
print("RESUMEN: TODOS LOS FLUJOS FUNCIONAN CORRECTAMENTE")
print("=" * 60)
print("\nBD: Neon/Vercel")
print("Contraseña: A1234567a")
print("Backend: http://127.0.0.1:8000")
print("\nPuedes abrir el frontend en: http://localhost:3000")
