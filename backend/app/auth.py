from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models, database

# Clé secrète utilisée pour signer les tokens JWT
# En production, stockez-la dans une variable d'environnement
SECRET_KEY = "votre_cle_secrete_tres_longue_a_changer_en_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 heures

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie qu'un mot de passe en clair correspond au hash stocké."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Génère le hash bcrypt d'un mot de passe (tronqué à 72 octets)."""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def create_access_token(data: dict) -> str:
    """Crée un token JWT avec une expiration."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)) -> models.User:
    """Décode le token, vérifie sa validité et retourne l'utilisateur correspondant."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user