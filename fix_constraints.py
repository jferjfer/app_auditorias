import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

sql = text("""
-- Eliminar constraints viejas
ALTER TABLE productos_auditados DROP CONSTRAINT IF EXISTS fk_last_modified_by CASCADE;
ALTER TABLE productos_auditados DROP CONSTRAINT IF EXISTS fk_locked_by CASCADE;
ALTER TABLE auditorias DROP CONSTRAINT IF EXISTS auditorias_auditor_id_fkey CASCADE;
ALTER TABLE product_history DROP CONSTRAINT IF EXISTS product_history_user_id_fkey CASCADE;
ALTER TABLE product_novelties DROP CONSTRAINT IF EXISTS product_novelties_user_id_fkey CASCADE;
ALTER TABLE informes_generados DROP CONSTRAINT IF EXISTS informes_generados_analista_id_fkey CASCADE;

-- Crear nuevas con SET NULL
ALTER TABLE auditorias ADD CONSTRAINT auditorias_auditor_id_fkey 
    FOREIGN KEY (auditor_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE productos_auditados ADD CONSTRAINT fk_locked_by 
    FOREIGN KEY (locked_by_user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE productos_auditados ADD CONSTRAINT fk_last_modified_by 
    FOREIGN KEY (last_modified_by_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE product_history ADD CONSTRAINT product_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE product_novelties ADD CONSTRAINT product_novelties_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE informes_generados ADD CONSTRAINT informes_generados_analista_id_fkey 
    FOREIGN KEY (analista_id) REFERENCES usuarios(id) ON DELETE SET NULL;
""")

print(f"Conectando a: {DATABASE_URL[:30]}...")

with engine.connect() as conn:
    conn.execute(sql)
    conn.commit()
    print("OK - Constraints actualizadas correctamente")
