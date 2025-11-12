"""set_null_on_user_delete

Revision ID: 52e304170c8b
Revises: add_product_novelties
Create Date: 2025-11-12 12:22:00.116817

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52e304170c8b'
down_revision: Union[str, None] = 'add_product_novelties'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Cambiar foreign keys para que usen SET NULL al eliminar usuario
    # Usar SQL directo para evitar problemas con nombres de constraints
    
    op.execute("""
        -- 1. auditorias.auditor_id
        ALTER TABLE auditorias DROP CONSTRAINT IF EXISTS auditorias_auditor_id_fkey;
        ALTER TABLE auditorias ADD CONSTRAINT auditorias_auditor_id_fkey 
            FOREIGN KEY (auditor_id) REFERENCES usuarios(id) ON DELETE SET NULL;
        
        -- 2. productos_auditados.locked_by_user_id
        ALTER TABLE productos_auditados DROP CONSTRAINT IF EXISTS productos_auditados_locked_by_user_id_fkey;
        ALTER TABLE productos_auditados ADD CONSTRAINT productos_auditados_locked_by_user_id_fkey 
            FOREIGN KEY (locked_by_user_id) REFERENCES usuarios(id) ON DELETE SET NULL;
        
        -- 3. productos_auditados.last_modified_by_id
        ALTER TABLE productos_auditados DROP CONSTRAINT IF EXISTS productos_auditados_last_modified_by_id_fkey;
        ALTER TABLE productos_auditados ADD CONSTRAINT productos_auditados_last_modified_by_id_fkey 
            FOREIGN KEY (last_modified_by_id) REFERENCES usuarios(id) ON DELETE SET NULL;
        
        -- 4. product_history.user_id
        ALTER TABLE product_history DROP CONSTRAINT IF EXISTS product_history_user_id_fkey;
        ALTER TABLE product_history ADD CONSTRAINT product_history_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;
        
        -- 5. product_novelties.user_id
        ALTER TABLE product_novelties DROP CONSTRAINT IF EXISTS product_novelties_user_id_fkey;
        ALTER TABLE product_novelties ADD CONSTRAINT product_novelties_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL;
        
        -- 6. informes_generados.analista_id
        ALTER TABLE informes_generados DROP CONSTRAINT IF EXISTS informes_generados_analista_id_fkey;
        ALTER TABLE informes_generados ADD CONSTRAINT informes_generados_analista_id_fkey 
            FOREIGN KEY (analista_id) REFERENCES usuarios(id) ON DELETE SET NULL;
    """)


def downgrade() -> None:
    # Revertir a RESTRICT (comportamiento por defecto)
    op.execute("""
        ALTER TABLE auditorias DROP CONSTRAINT IF EXISTS auditorias_auditor_id_fkey;
        ALTER TABLE auditorias ADD CONSTRAINT auditorias_auditor_id_fkey 
            FOREIGN KEY (auditor_id) REFERENCES usuarios(id);
        
        ALTER TABLE productos_auditados DROP CONSTRAINT IF EXISTS productos_auditados_locked_by_user_id_fkey;
        ALTER TABLE productos_auditados ADD CONSTRAINT productos_auditados_locked_by_user_id_fkey 
            FOREIGN KEY (locked_by_user_id) REFERENCES usuarios(id);
        
        ALTER TABLE productos_auditados DROP CONSTRAINT IF EXISTS productos_auditados_last_modified_by_id_fkey;
        ALTER TABLE productos_auditados ADD CONSTRAINT productos_auditados_last_modified_by_id_fkey 
            FOREIGN KEY (last_modified_by_id) REFERENCES usuarios(id);
        
        ALTER TABLE product_history DROP CONSTRAINT IF EXISTS product_history_user_id_fkey;
        ALTER TABLE product_history ADD CONSTRAINT product_history_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES usuarios(id);
        
        ALTER TABLE product_novelties DROP CONSTRAINT IF EXISTS product_novelties_user_id_fkey;
        ALTER TABLE product_novelties ADD CONSTRAINT product_novelties_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES usuarios(id);
        
        ALTER TABLE informes_generados DROP CONSTRAINT IF EXISTS informes_generados_analista_id_fkey;
        ALTER TABLE informes_generados ADD CONSTRAINT informes_generados_analista_id_fkey 
            FOREIGN KEY (analista_id) REFERENCES usuarios(id);
    """)
