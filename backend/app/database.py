from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Utilise DATABASE_URL si elle est définie (sur Render), sinon SQLite local
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./munya_paie.db")

if DATABASE_URL.startswith("postgres://"):
    # Render fournit parfois postgres:// ; SQLAlchemy 1.4+ exige postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()