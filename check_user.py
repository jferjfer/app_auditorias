"""
Verificar si un usuario existe
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

email = "jose.vertel@laika.com.co"

with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM usuarios WHERE correo = :email"), {"email": email})
    user = result.fetchone()
    
    if user:
        print(f"Usuario encontrado: {user}")
    else:
        print(f"Usuario NO existe: {email}")
        print("\nUsuarios disponibles:")
        result = conn.execute(text("SELECT correo, rol FROM usuarios ORDER BY rol"))
        for row in result:
            print(f"  {row[0]} ({row[1]})")
