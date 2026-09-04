from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, time, timedelta
from typing import Optional, List
from decimal import Decimal
import csv
import io
import os
import secrets
from fastapi.responses import StreamingResponse

from . import models, schemas
from .auth import get_password_hash

# ------------------------------------------------------------
# EMPLOYÉS
# ------------------------------------------------------------
def get_employees(db: Session):
    return db.query(models.Employee).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    db_employee = models.Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def delete_employee(db: Session, employee_id: int):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        return None
    db.delete(employee)
    db.commit()
    return employee

# ------------------------------------------------------------
# POINTAGES (PRÉSENCES)
# ------------------------------------------------------------
def record_attendance(db: Session, attendance_data: schemas.AttendanceRecordCreate):
    try:
        record_date = datetime.strptime(attendance_data.date, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError("Format de date invalide. Utilisez YYYY-MM-DD.")

    existing = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.employee_id == attendance_data.employee_id,
        models.AttendanceRecord.date == record_date
    ).first()

    if existing:
        if attendance_data.check_in:
            existing.check_in = datetime.strptime(attendance_data.check_in, "%H:%M").time()
        if attendance_data.check_out:
            existing.check_out = datetime.strptime(attendance_data.check_out, "%H:%M").time()
        existing.status = "present" if existing.check_in and existing.check_out else "absent"
        db.commit()
        db.refresh(existing)
        return _attendance_to_dict(existing)
    else:
        db_record = models.AttendanceRecord(
            employee_id=attendance_data.employee_id,
            date=record_date,
            check_in=datetime.strptime(attendance_data.check_in, "%H:%M").time() if attendance_data.check_in else None,
            check_out=datetime.strptime(attendance_data.check_out, "%H:%M").time() if attendance_data.check_out else None,
            status="present" if attendance_data.check_in and attendance_data.check_out else "absent"
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return _attendance_to_dict(db_record)

def _attendance_to_dict(record: models.AttendanceRecord) -> dict:
    return {
        "id": record.id,
        "employee_id": record.employee_id,
        "date": record.date,
        "check_in": record.check_in.strftime("%H:%M") if record.check_in else None,
        "check_out": record.check_out.strftime("%H:%M") if record.check_out else None,
        "status": record.status,
    }

def get_attendance_by_date(db: Session, record_date: date):
    records = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.date == record_date).all()
    return [_attendance_to_dict(r) for r in records]

def get_attendance_by_employee(db: Session, employee_id: int):
    records = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.employee_id == employee_id).order_by(models.AttendanceRecord.date.desc()).all()
    return [_attendance_to_dict(r) for r in records]

# ------------------------------------------------------------
# CONTRATS
# ------------------------------------------------------------
def create_contract(db: Session, contract: schemas.ContractCreate):
    db_contract = models.Contract(**contract.model_dump())
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

def get_contracts_by_employee(db: Session, employee_id: int):
    return db.query(models.Contract).filter(models.Contract.employee_id == employee_id).all()

def delete_contract(db: Session, contract_id: int):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if contract:
        db.delete(contract)
        db.commit()
    return contract

# ------------------------------------------------------------
# STOCK ET MOUVEMENTS
# ------------------------------------------------------------
def get_stock_items(db: Session):
    return db.query(models.StockItem).all()

def create_stock_item(db: Session, item: schemas.StockItemCreate):
    db_item = models.StockItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    db_movement = models.StockMovement(
        item_id=db_item.id,
        movement_type=models.MovementType.ENTREE,
        quantity=db_item.quantity,
        reason="Stock initial",
        movement_date=date.today()
    )
    db.add(db_movement)
    db.commit()
    return db_item

def update_stock_quantity(db: Session, item_id: int, delta: int, reason: str):
    db_item = db.query(models.StockItem).filter(models.StockItem.id == item_id).first()
    if not db_item:
        return None

    new_qty = db_item.quantity + delta
    if new_qty < 0:
        raise ValueError("Quantité en stock insuffisante")

    db_item.quantity = new_qty

    db_movement = models.StockMovement(
        item_id=item_id,
        movement_type=models.MovementType.ENTREE if delta > 0 else models.MovementType.SORTIE,
        quantity=abs(delta),
        reason=reason,
        movement_date=date.today()
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_stock_movements(db: Session):
    return db.query(models.StockMovement).all()

# ------------------------------------------------------------
# FINANCE (TRANSACTIONS)
# ------------------------------------------------------------
def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: Optional[int] = None):
    db_trans = models.Transaction(
        **transaction.model_dump(),
        created_by=user_id,
        is_edited=False
    )
    db.add(db_trans)
    db.commit()
    db.refresh(db_trans)
    return db_trans

def get_transactions(db: Session, skip: int = 0, limit: int = 50):
    return db.query(models.Transaction).order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()

def update_transaction(db: Session, transaction_id: int, data: schemas.TransactionUpdate, user_id: int):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not transaction:
        return None
    if transaction.created_by != user_id:
        raise PermissionError("Seul le créateur peut modifier cette écriture.")
    if transaction.is_edited:
        raise ValueError("Cette écriture a déjà été modifiée une fois.")

    update_data = data.dict(exclude_unset=True)

    # Conversion des champs
    if "date" in update_data and update_data["date"] not in (None, ""):
        update_data["date"] = datetime.strptime(update_data["date"], "%Y-%m-%d").date()
    if "amount" in update_data and update_data["amount"] not in (None, ""):
        update_data["amount"] = Decimal(str(update_data["amount"]))
    if "type" in update_data and update_data["type"] not in (None, ""):
        update_data["type"] = models.TransactionType(update_data["type"])

    for field, value in update_data.items():
        if value is not None and value != "":
            setattr(transaction, field, value)

    transaction.is_edited = True
    transaction.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(transaction)
    return transaction

def get_financial_summary(db: Session):
    total_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == models.TransactionType.INCOME
    ).scalar() or 0
    total_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == models.TransactionType.EXPENSE
    ).scalar() or 0
    net = float(total_income) - float(total_expense)
    recent = get_transactions(db, limit=10)
    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_balance": net,
        "recent_transactions": recent
    }

# ------------------------------------------------------------
# PAIE (PRIMES ET AVANCES)
# ------------------------------------------------------------
def create_prime(db: Session, prime_data: schemas.PrimeCreate):
    db_prime = models.Prime(**prime_data.model_dump())
    db.add(db_prime)
    db.commit()
    db.refresh(db_prime)
    return db_prime

def get_primes(db: Session, month: Optional[str] = None):
    query = db.query(models.Prime)
    if month:
        query = query.filter(models.Prime.month == month)
    return query.all()

def create_avance(db: Session, avance_data: schemas.AvanceCreate):
    db_avance = models.Avance(**avance_data.model_dump())
    db.add(db_avance)
    db.commit()
    db.refresh(db_avance)
    return db_avance

def get_avances(db: Session, employee_id: Optional[int] = None):
    query = db.query(models.Avance)
    if employee_id:
        query = query.filter(models.Avance.employee_id == employee_id)
    return query.all()

# ------------------------------------------------------------
# CALCUL DE PAIE (ADAPTÉ AVEC PRIMES ET AVANCES)
# ------------------------------------------------------------
def calculate_payroll(db: Session, start_date: date, end_date: date):
    settings = get_settings(db)
    cnss_rate = float(settings.get("cnss_rate", 0.05))
    inpp_rate = float(settings.get("inpp_rate", 0.02))
    working_days = int(settings.get("working_days_per_month", 26))
    ipr_b1_limit = float(settings.get("ipr_bracket1_limit", 500))
    ipr_b1_rate = float(settings.get("ipr_bracket1_rate", 0))
    ipr_b2_limit = float(settings.get("ipr_bracket2_limit", 1000))
    ipr_b2_rate = float(settings.get("ipr_bracket2_rate", 0.15))
    ipr_b3_rate = float(settings.get("ipr_bracket3_rate", 0.30))

    employees = db.query(models.Employee).all()
    results = []

    for emp in employees:
        attendances = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.employee_id == emp.id,
            models.AttendanceRecord.date >= start_date,
            models.AttendanceRecord.date <= end_date
        ).all()

        days_worked = 0
        regular_hours = 0.0
        overtime_hours = 0.0

        for att in attendances:
            if att.check_in and att.check_out:
                t_in = datetime.combine(att.date, att.check_in)
                t_out = datetime.combine(att.date, att.check_out)
                if t_out < t_in:
                    t_out += timedelta(days=1)
                worked = (t_out - t_in).total_seconds() / 3600.0
                regular = min(worked, 8.0)
                overtime = max(0.0, worked - 8.0)
                regular_hours += regular
                overtime_hours += overtime
                days_worked += 1

        daily_rate = float(emp.base_salary) / working_days
        hourly_rate = daily_rate / 8.0
        salary_days = daily_rate * days_worked
        overtime_pay = overtime_hours * hourly_rate * 1.5

        month_str = start_date.strftime("%Y-%m")
        primes_total = db.query(func.sum(models.Prime.amount)).filter(
            models.Prime.employee_id == emp.id,
            models.Prime.month == month_str
        ).scalar() or 0
        primes_total = float(primes_total)

        avances_total = db.query(func.sum(models.Avance.amount)).filter(
            models.Avance.employee_id == emp.id,
            models.Avance.deducted == False,
            models.Avance.date >= start_date,
            models.Avance.date <= end_date
        ).scalar() or 0
        avances_total = float(avances_total)

        gross = salary_days + overtime_pay + primes_total
        cnss = gross * cnss_rate
        inpp = gross * inpp_rate

        if gross <= ipr_b1_limit:
            ipr = ipr_b1_rate * gross
        elif gross <= ipr_b2_limit:
            ipr = (gross - ipr_b1_limit) * ipr_b2_rate
        else:
            ipr = (ipr_b2_limit - ipr_b1_limit) * ipr_b2_rate + (gross - ipr_b2_limit) * ipr_b3_rate

        net = gross - cnss - inpp - ipr - avances_total

        avances = db.query(models.Avance).filter(
            models.Avance.employee_id == emp.id,
            models.Avance.deducted == False,
            models.Avance.date >= start_date,
            models.Avance.date <= end_date
        ).all()
        for av in avances:
            av.deducted = True
        db.commit()

        results.append(schemas.PayrollEmployee(
            employee_id=emp.id,
            full_name=emp.full_name,
            base_salary=float(emp.base_salary),
            days_worked=days_worked,
            regular_hours=round(regular_hours, 2),
            overtime_hours=round(overtime_hours, 2),
            gross_salary=round(gross, 2),
            cnss=round(cnss, 2),
            inpp=round(inpp, 2),
            ipr=round(ipr, 2),
            net_salary=round(net, 2)
        ))

    return results

# ------------------------------------------------------------
# UTILISATEURS
# ------------------------------------------------------------
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user_data: schemas.UserCreate):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise ValueError("Un utilisateur avec cet email existe déjà.")
    password = user_data.password or secrets.token_urlsafe(8)
    hashed = get_password_hash(password)
    db_user = models.User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        hashed_password=hashed,
        must_change_password=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user, password

def get_users(db: Session):
    return db.query(models.User).all()

# ------------------------------------------------------------
# PARAMÈTRES
# ------------------------------------------------------------
def get_settings(db: Session) -> dict:
    settings = db.query(models.Setting).all()
    return {s.key: s.value for s in settings}

def update_setting(db: Session, key: str, value: str):
    setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    if not setting:
        raise ValueError("Clé de paramètre inexistante")
    setting.value = value
    db.commit()
    return setting

def initialize_settings(db: Session):
    defaults = {
        "cnss_rate": "0.05",
        "inpp_rate": "0.02",
        "ipr_bracket1_limit": "500",
        "ipr_bracket1_rate": "0",
        "ipr_bracket2_limit": "1000",
        "ipr_bracket2_rate": "0.15",
        "ipr_bracket3_rate": "0.30",
        "working_days_per_month": "26",
        "standard_start_time": "08:00",
        "standard_end_time": "17:00",
        "company_name": "MUNYA CONSTRUCT",
        "company_address": "Av. Judex Lupepe, coin marché Muyej, Kolwezi RDC",
        "company_phone": "+243 903 295 707, +243 992 965 897",
        "company_email": "info@munya-construct.cpm",
        "company_rccm": "CD/KNG/RCCM/20-A-01528",
        "company_idnat": "01-04701-N05692A",
        "company_impot": "A2171268P",
    }
    for key, value in defaults.items():
        if not db.query(models.Setting).filter(models.Setting.key == key).first():
            db.add(models.Setting(key=key, value=value))
    db.commit()

# ------------------------------------------------------------
# HISTORIQUE DE CONNEXION
# ------------------------------------------------------------
def add_login_history(db: Session, user_id: int, ip_address: Optional[str] = None):
    entry = models.LoginHistory(user_id=user_id, ip_address=ip_address)
    db.add(entry)
    db.commit()

def get_login_history(db: Session, limit: int = 100):
    return db.query(models.LoginHistory).order_by(models.LoginHistory.login_time.desc()).limit(limit).all()

# ------------------------------------------------------------
# DOCUMENTS
# ------------------------------------------------------------
def create_document(db: Session, filename: str, file_path: str, content_type: str, size: int, uploaded_by: int):
    db_doc = models.Document(
        filename=filename,
        file_path=file_path,
        content_type=content_type,
        size=size,
        uploaded_by=uploaded_by
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def get_documents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Document).order_by(models.Document.upload_date.desc()).offset(skip).limit(limit).all()

def delete_document(db: Session, document_id: int):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if doc:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
        db.delete(doc)
        db.commit()
    return doc

# ------------------------------------------------------------
# EXPORTS CSV
# ------------------------------------------------------------
def export_employees_csv(db: Session):
    employees = get_employees(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Nom complet", "Rôle", "Salaire base", "Statut"])
    for e in employees:
        writer.writerow([e.id, e.full_name, e.role, e.base_salary, e.status])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employes.csv"}
    )

# ------------------------------------------------------------
# CLIENTS
# ------------------------------------------------------------
def create_client(db: Session, client_data: schemas.ClientCreate):
    db_client = models.Client(**client_data.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def get_clients(db: Session):
    return db.query(models.Client).all()

# ------------------------------------------------------------
# FACTURES
# ------------------------------------------------------------
def create_invoice(db: Session, invoice_data: schemas.InvoiceCreate):
    last_invoice = db.query(models.Invoice).order_by(models.Invoice.id.desc()).first()
    next_id = last_invoice.id + 1 if last_invoice else 1
    invoice_number = f"FAC-{str(next_id).zfill(6)}"

    total_ht = Decimal(0)
    db_invoice = models.Invoice(
        invoice_number=invoice_number,
        client_id=invoice_data.client_id,
        issue_date=invoice_data.issue_date,
        due_date=invoice_data.due_date,
        notes=invoice_data.notes,
        status=models.InvoiceStatus.DRAFT,
        tva_rate=16
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    for line in invoice_data.lines:
        line_total = Decimal(line.quantity) * line.unit_price
        db_line = models.InvoiceLine(
            invoice_id=db_invoice.id,
            description=line.description,
            quantity=line.quantity,
            unit_price=line.unit_price,
            line_total=line_total
        )
        db.add(db_line)
        total_ht += line_total

    db_invoice.total_ht = total_ht
    db_invoice.total_ttc = total_ht * (1 + db_invoice.tva_rate / 100)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_invoices(db: Session):
    return db.query(models.Invoice).all()

# ------------------------------------------------------------
# FOURNISSEURS
# ------------------------------------------------------------
def create_supplier(db: Session, supplier_data: schemas.SupplierCreate):
    db_supplier = models.Supplier(**supplier_data.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def get_suppliers(db: Session):
    return db.query(models.Supplier).all()

# ------------------------------------------------------------
# COMMANDES D'ACHAT
# ------------------------------------------------------------
def create_purchase_order(db: Session, po_data: schemas.PurchaseOrderCreate):
    last_po = db.query(models.PurchaseOrder).order_by(models.PurchaseOrder.id.desc()).first()
    next_id = last_po.id + 1 if last_po else 1
    order_number = f"PO-{str(next_id).zfill(6)}"

    total = Decimal(0)
    db_po = models.PurchaseOrder(
        order_number=order_number,
        supplier_id=po_data.supplier_id,
        order_date=po_data.order_date,
        expected_date=po_data.expected_date,
        status=models.PurchaseOrderStatus.PENDING
    )
    db.add(db_po)
    db.commit()
    db.refresh(db_po)

    for line in po_data.lines:
        line_total = Decimal(line.quantity) * line.unit_price
        db_line = models.PurchaseOrderLine(
            purchase_order_id=db_po.id,
            description=line.description,
            quantity=line.quantity,
            unit_price=line.unit_price,
            line_total=line_total
        )
        db.add(db_line)
        total += line_total

    db_po.total = total
    db.commit()
    db.refresh(db_po)
    return db_po

def get_purchase_orders(db: Session):
    return db.query(models.PurchaseOrder).all()