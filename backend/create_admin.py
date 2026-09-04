from app.database import SessionLocal
from app.auth import get_password_hash
from app import models

db = SessionLocal()
try:
    existing = db.query(models.User).filter(models.User.email == 'musaumelka@gmail.com').first()
    if existing:
        print('L\'administrateur existe déjà.')
    else:
        hashed = get_password_hash('type@mel19')
        user = models.User(
            full_name='Administrateur',
            email='musaumelka@gmail.com',
            role='admin',
            hashed_password=hashed,
            must_change_password=False
        )
        db.add(user)
        db.commit()
        print('✅ Administrateur créé avec succès')
except Exception as e:
    print(f'Erreur : {e}')
finally:
    db.close()