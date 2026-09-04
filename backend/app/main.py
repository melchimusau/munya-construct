from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from typing import List, Optional
from pathlib import Path
import shutil

from .database import engine, Base, get_db
from . import models, schemas, crud
from .auth import (
    get_current_user,
    create_access_token,
    verify_password,
    get_password_hash,
)

# Création de l'application FastAPI
app = FastAPI(title="Munya Paie API", version="1.0.0")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dossier pour les uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Création des tables au démarrage
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    crud.initialize_settings(db)

# ------------------------------------------------------------
# RACINE
# ------------------------------------------------------------
@app.get("/")
def read_root():
    return {"status": "Munya Paie Backend API opérationnel !"}

# ------------------------------------------------------------
# AUTHENTIFICATION
# ------------------------------------------------------------
@app.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    access_token = create_access_token(data={"sub": user.email})
    crud.add_login_history(db, user.id, request.client.host)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "username": user.email,
        },
    }

@app.post("/change-password")
def change_password(
    data: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Mot de passe modifié avec succès"}

# ------------------------------------------------------------
# GESTION DES UTILISATEURS (admin)
# ------------------------------------------------------------
@app.get("/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    users = crud.get_users(db)
    return [
        {"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role, "username": u.email}
        for u in users
    ]

@app.post("/users", response_model=schemas.UserResponse)
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    try:
        new_user, temp_password = crud.create_user(db, user_data)
        return {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "username": new_user.email,
            "temporary_password": temp_password,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ------------------------------------------------------------
# EMPLOYÉS
# ------------------------------------------------------------
@app.get("/employees", response_model=List[schemas.EmployeeResponse])
def read_employees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_employees(db)

@app.post("/employees", response_model=schemas.EmployeeResponse)
def create_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_employee(db=db, employee=employee)

@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deleted = crud.delete_employee(db=db, employee_id=employee_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return {"message": "Employé supprimé"}

# ------------------------------------------------------------
# CONTRATS
# ------------------------------------------------------------
@app.post("/contracts", response_model=schemas.ContractResponse)
def create_contract(
    contract: schemas.ContractCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_contract(db, contract)

@app.get("/employees/{employee_id}/contracts", response_model=List[schemas.ContractResponse])
def get_employee_contracts(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_contracts_by_employee(db, employee_id)

@app.delete("/contracts/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deleted = crud.delete_contract(db, contract_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    return {"message": "Contrat supprimé"}

# ------------------------------------------------------------
# POINTAGES
# ------------------------------------------------------------
@app.get("/attendance/{record_date}")
def read_attendance(
    record_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_attendance_by_date(db, record_date=record_date)

@app.post("/attendance/record")
def record_attendance(
    record: schemas.AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        return crud.record_attendance(db=db, attendance_data=record)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

# ------------------------------------------------------------
# CALCUL DE PAIE
# ------------------------------------------------------------
@app.post("/payroll/calculate")
def calculate_payroll(
    payroll_input: schemas.PayrollInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.calculate_payroll(db, start_date=payroll_input.start_date, end_date=payroll_input.end_date)

# ------------------------------------------------------------
# PRIMES
# ------------------------------------------------------------
@app.post("/primes", response_model=schemas.PrimeResponse)
def create_prime(
    prime: schemas.PrimeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_prime(db, prime)

@app.get("/primes", response_model=List[schemas.PrimeResponse])
def list_primes(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_primes(db, month)

# ------------------------------------------------------------
# AVANCES
# ------------------------------------------------------------
@app.post("/avances", response_model=schemas.AvanceResponse)
def create_avance(
    avance: schemas.AvanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_avance(db, avance)

@app.get("/avances", response_model=List[schemas.AvanceResponse])
def list_avances(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_avances(db, employee_id)

# ------------------------------------------------------------
# STOCK
# ------------------------------------------------------------
@app.get("/stock")
def read_stock_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_stock_items(db)

@app.post("/stock")
def create_stock_item(
    item: schemas.StockItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_stock_item(db=db, item=item)

@app.patch("/stock/{item_id}/quantity")
def update_stock_quantity(
    item_id: int,
    delta: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        updated = crud.update_stock_quantity(db=db, item_id=item_id, delta=delta, reason=reason)
        if not updated:
            raise HTTPException(status_code=404, detail="Matériau introuvable")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/stock/movements")
def read_stock_movements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_stock_movements(db)

# ------------------------------------------------------------
# FINANCE (TRANSACTIONS)
# ------------------------------------------------------------
@app.post("/transactions")
def add_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_transaction(db, transaction, current_user.id)

@app.get("/transactions")
def read_transactions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_transactions(db, skip=skip, limit=limit)

@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        updated = crud.update_transaction(db, transaction_id, transaction, current_user.id)
        if not updated:
            raise HTTPException(status_code=404, detail="Transaction introuvable")
        return updated
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.patch("/transactions/{transaction_id}")
def update_transaction_patch(
    transaction_id: int,
    transaction: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        updated = crud.update_transaction(db, transaction_id, transaction, current_user.id)
        if not updated:
            raise HTTPException(status_code=404, detail="Transaction introuvable")
        return updated
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/financial-summary")
def get_financial_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_financial_summary(db)

# ------------------------------------------------------------
# CLIENTS
# ------------------------------------------------------------
@app.post("/clients", response_model=schemas.ClientResponse)
def create_client(
    client: schemas.ClientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_client(db, client)

@app.get("/clients", response_model=List[schemas.ClientResponse])
def list_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_clients(db)

# ------------------------------------------------------------
# FACTURES
# ------------------------------------------------------------
@app.post("/invoices", response_model=schemas.InvoiceResponse)
def create_invoice(
    invoice: schemas.InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_invoice(db, invoice)

@app.get("/invoices", response_model=List[schemas.InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_invoices(db)

# ------------------------------------------------------------
# FOURNISSEURS
# ------------------------------------------------------------
@app.post("/suppliers", response_model=schemas.SupplierResponse)
def create_supplier(
    supplier: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_supplier(db, supplier)

@app.get("/suppliers", response_model=List[schemas.SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_suppliers(db)

# ------------------------------------------------------------
# COMMANDES D'ACHAT
# ------------------------------------------------------------
@app.post("/purchase-orders", response_model=schemas.PurchaseOrderResponse)
def create_purchase_order(
    po: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_purchase_order(db, po)

@app.get("/purchase-orders", response_model=List[schemas.PurchaseOrderResponse])
def list_purchase_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_purchase_orders(db)

# ------------------------------------------------------------
# PORTAIL EMPLOYÉ
# ------------------------------------------------------------
@app.get("/me", response_model=schemas.EmployeeResponse)
def get_my_info(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employee = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return employee

@app.get("/me/attendance")
def get_my_attendance(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employee = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return crud.get_attendance_by_employee(db, employee.id)

@app.get("/me/contracts")
def get_my_contracts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employee = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return crud.get_contracts_by_employee(db, employee.id)

@app.get("/me/payslips")
def get_my_payslips(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employee = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")
    return []

# ------------------------------------------------------------
# TABLEAU DE BORD DÉCISIONNEL (BI)
# ------------------------------------------------------------
@app.get("/bi/sales-monthly")
def bi_sales_monthly(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = db.query(
        func.strftime("%Y-%m", models.Invoice.issue_date).label("month"),
        func.sum(models.Invoice.total_ttc).label("total")
    ).filter(models.Invoice.status == models.InvoiceStatus.PAID).group_by("month").order_by("month").all()
    return [{"month": month, "total": float(total)} for month, total in result]

@app.get("/bi/expenses-by-category")
def bi_expenses_by_category(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = db.query(
        models.Transaction.category,
        func.sum(models.Transaction.amount).label("total")
    ).filter(models.Transaction.type == models.TransactionType.EXPENSE).group_by(models.Transaction.category).all()
    return [{"category": category or "Autres", "total": float(total)} for category, total in result]

@app.get("/bi/top-products")
def bi_top_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = db.query(
        models.StockItem.name,
        func.sum(models.StockMovement.quantity).label("qty")
    ).join(models.StockMovement, models.StockMovement.item_id == models.StockItem.id).filter(
        models.StockMovement.movement_type == models.MovementType.SORTIE
    ).group_by(models.StockItem.name).order_by(func.sum(models.StockMovement.quantity).desc()).limit(5).all()
    return [{"name": name, "quantity": int(qty)} for name, qty in result]

# ------------------------------------------------------------
# PARAMÈTRES (admin)
# ------------------------------------------------------------
@app.get("/settings")
def get_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return crud.get_settings(db)

@app.put("/settings/{key}")
def update_setting(
    key: str,
    setting: schemas.SettingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    try:
        crud.update_setting(db, key, setting.value)
        return {"message": "Paramètre mis à jour"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ------------------------------------------------------------
# JOURNAL DES CONNEXIONS (admin)
# ------------------------------------------------------------
@app.get("/login-history", response_model=List[schemas.LoginHistoryResponse])
def get_login_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return crud.get_login_history(db)

# ------------------------------------------------------------
# EXPORTS (admin)
# ------------------------------------------------------------
@app.get("/export/employees")
def export_employees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return crud.export_employees_csv(db)

# ------------------------------------------------------------
# DOCUMENTS
# ------------------------------------------------------------
@app.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    file_ext = Path(file.filename).suffix
    unique_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{current_user.id}_{file.filename}"
    file_path = UPLOAD_DIR / unique_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size = file_path.stat().st_size
    doc = crud.create_document(
        db,
        filename=file.filename,
        file_path=str(file_path),
        content_type=file.content_type,
        size=size,
        uploaded_by=current_user.id
    )
    return doc

@app.get("/documents", response_model=List[schemas.DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.get_documents(db)

@app.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return FileResponse(doc.file_path, filename=doc.filename)

@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    deleted = crud.delete_document(db, document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return {"message": "Document supprimé"}

@app.post("/create-admin")
def create_admin(user: schemas.UserCreate, db: Session = Depends(get_db)):
    user.role = "admin"
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Utilisateur existe déjà")
    new_user, password = crud.create_user(db, user)
    return {"message": "Admin créé", "email": new_user.email, "temporary_password": password}
@app.post("/force-password")
def force_password(
    email: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    user.hashed_password = get_password_hash(new_password)
    user.must_change_password = False
    db.commit()
    return {"message": "Mot de passe mis à jour", "email": user.email}