"""
Comparar usuarios entre BD antigua y nueva
"""
from sqlalchemy import create_engine, text

OLD_DB = "postgresql://app_auditorias2_user:0faanYPH04DZhpvQnZ4uc6FzVhsCZQIv@dpg-d4gb056uk2gs73ch84cg-a.oregon-postgres.render.com/app_auditorias2?sslmode=require"
NEW_DB = "postgresql://neondb_owner:npg_pAf9Vc8QODjg@ep-blue-feather-a4jcgc5l-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

old_engine = create_engine(OLD_DB)
new_engine = create_engine(NEW_DB)

print("USUARIOS EN BD ANTIGUA (Render):")
print("-" * 60)
with old_engine.connect() as conn:
    result = conn.execute(text("SELECT id, correo, nombre, rol FROM usuarios ORDER BY id"))
    old_users = {row[1]: row for row in result}
    for email, (id, correo, nombre, rol) in old_users.items():
        print(f"{id:3} | {correo:40} | {nombre:30} | {rol}")

print("\n\nUSUARIOS EN BD NUEVA (Neon):")
print("-" * 60)
with new_engine.connect() as conn:
    result = conn.execute(text("SELECT id, correo, nombre, rol FROM usuarios ORDER BY id"))
    new_users = {row[1]: row for row in result}
    for email, (id, correo, nombre, rol) in new_users.items():
        print(f"{id:3} | {correo:40} | {nombre:30} | {rol}")

print("\n\nDIFERENCIAS:")
print("-" * 60)
missing = set(old_users.keys()) - set(new_users.keys())
if missing:
    print("Usuarios que FALTAN en nueva BD:")
    for email in missing:
        print(f"  - {email} ({old_users[email][2]})")
else:
    print("Todos los usuarios fueron migrados correctamente")

extra = set(new_users.keys()) - set(old_users.keys())
if extra:
    print("\nUsuarios EXTRA en nueva BD:")
    for email in extra:
        print(f"  + {email} ({new_users[email][2]})")
