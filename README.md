# Munya Construct

Application complète de gestion d'entreprise : ressources humaines, paie, stock, finance, facturation et analyse décisionnelle.

##  Fonctionnalités principales

- **Authentification sécurisée** avec rôles (admin, RH, PDG, employé) et changement de mot de passe à la première connexion.
- **Gestion des employés** : fiches, contrats, primes, avances.
- **Présence** : pointage quotidien, historique.
- **Paie** : calcul automatique basé sur 26 jours ouvrés, heures supplémentaires, CNSS, INPP, IPR, primes, avances.
- **Stock** : articles, mouvements, valorisation, bons de sortie.
- **Finance** : transactions, résumé, modification unique par le créateur.
- **Facturation client** : clients, factures avec lignes dynamiques, numérotation automatique.
- **Achats** : fournisseurs, commandes d'achat.
- **Tableau de bord décisionnel** : graphiques (ventes, dépenses, top produits).
- **Gestion documentaire** : upload/téléchargement de PDF, DOCX, Excel.

##  Technologies

- **Backend** : Python, FastAPI, SQLAlchemy, SQLite, JWT (bcrypt)
- **Frontend** : React, TypeScript, Vite, Tailwind CSS, Recharts
- **Desktop** (optionnel) : Tauri

##  Structure du projet



##  Installation et démarrage
### Frontend
    cd frontend
    npm install
    npm run dev

### Backend
```bash
    cd backend
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # macOS/Linux
    source .venv/bin/activate
    
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    
###Compte administrateur###

Lors du premier démarrage, créez l'utilisateur admin :
bash

cd backend
python create_admin.py



