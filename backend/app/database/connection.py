from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:9842@localhost:5432/socialpilot"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
        
def test_database_connection():
    try:
        with engine.connect() as connection:
            print("✅ PostgreSQL connection successful!")
    except Exception as e:
        print("❌ PostgreSQL connection failed!")
        print(e)