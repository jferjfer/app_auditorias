
import sqlalchemy

DATABASE_URL = "postgresql://app_auditorias_b5oy_user:24c3KQxW7f9YHsnRlLqyhI9QHKjoblvu@dpg-d3ueo888dl3ps73f3k96g-a.oregon-postgres.render.com/app_auditorias_b5oy"

try:
    engine = sqlalchemy.create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(sqlalchemy.text("SELECT * FROM alembic_version"))
        for row in result:
            print(f"Current migration version: {row[0]}")
except Exception as e:
    print(f"An error occurred: {e}")
