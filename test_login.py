"""
Probar login con los 3 roles
"""
import urllib.request
import urllib.parse
import json

API_URL = "http://127.0.0.1:8000/api/auth/login"

usuarios = [
    {"email": "javier@laika.com.co", "password": "A1234567a", "rol": "administrador"},
    {"email": "felipe@laika.com.co", "password": "A1234567a", "rol": "analista"},
    {"email": "carlos@laika.com.co", "password": "A1234567a", "rol": "auditor"}
]

print("PROBANDO LOGIN CON 3 ROLES\n")

for user in usuarios:
    print(f"Probando: {user['email']} ({user['rol']})")
    
    try:
        data = urllib.parse.urlencode({"username": user["email"], "password": user["password"]}).encode()
        req = urllib.request.Request(API_URL, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"  OK - Token: {result['access_token'][:30]}...")
            print(f"  Usuario: {result['user_name']}")
            print(f"  Rol: {result['user_role']}")
    except urllib.error.HTTPError as e:
        print(f"  ERROR {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"  ERROR: {e}")
    
    print("-" * 50)

print("\nPRUEBA COMPLETADA")
