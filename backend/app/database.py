from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# URL de la base de données SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./munya_paie.db"

# Création du moteur
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # nécessaire pour SQLite
)

# Session locale
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe de base pour les modèles
Base = declarative_base()

def get_db():
    """
    Générateur de session de base de données.
    Utilisé comme dépendance dans les endpoints FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()