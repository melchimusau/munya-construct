from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, ForeignKey, Enum, Float, Time, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime, date
import enum

# ------------------------------------------------------------
# ÉNUMÉRATIONS
# ------------------------------------------------------------
class EmployeeStatus(str, enum.Enum):
    ACTIF = "Actif"
    ESSAI = "Essai"
    INACTIF = "Inactif"

class MovementType(str, enum.Enum):
    ENTREE = "entrée"
    SORTIE = "sortie"

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    RH = "rh"
    PDG = "pdg"
    EMPLOYEE = "employee"

class ContractType(str, enum.Enum):
    CDI = "CDI"
    CDD = "CDD"
    FREELANCE = "Freelance"
    INTERIM = "Intérim"
    STAGE = "Stage"

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class PurchaseOrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ORDERED = "ORDERED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"

# ------------------------------------------------------------
# MODÈLE EMPLOYÉ
# ------------------------------------------------------------
class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.ACTIF)
    base_salary = Column(Numeric(10, 2), nullable=False)
    email = Column(String(100), unique=True, nullable=True)

    attendances = relationship("AttendanceRecord", back_populates="employee", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="employee", cascade="all, delete-orphan")
    primes = relationship("Prime", back_populates="employee", cascade="all, delete-orphan")
    avances = relationship("Avance", back_populates="employee", cascade="all, delete-orphan")

# ------------------------------------------------------------
# MODÈLE POINTAGE
# ------------------------------------------------------------
class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)
    status = Column(String, default="absent")

    employee = relationship("Employee", back_populates="attendances")

# ------------------------------------------------------------
# MODÈLE CONTRAT
# ------------------------------------------------------------
class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    contract_type = Column(Enum(ContractType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    trial_end_date = Column(Date, nullable=True)
    salary = Column(Numeric(10, 2), nullable=False)
    document_path = Column(String(255), nullable=True)
    notes = Column(String(500), nullable=True)

    employee = relationship("Employee", back_populates="contracts")

# ------------------------------------------------------------
# MODÈLE STOCK
# ------------------------------------------------------------
class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    description = Column(String(255), nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    movements = relationship("StockMovement", back_populates="item", cascade="all, delete-orphan")

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("stock_items.id", ondelete="CASCADE"), nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(200), nullable=True)
    movement_date = Column(Date, default=date.today, nullable=False)

    item = relationship("StockItem", back_populates="movements")

# ------------------------------------------------------------
# MODÈLE FINANCE (TRANSACTIONS)
# ------------------------------------------------------------
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=date.today, nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    category = Column(String(100), nullable=True)
    reference = Column(String(100), nullable=True)

    # Nouveaux champs pour la modification unique
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)

# ------------------------------------------------------------
# MODÈLE UTILISATEUR
# ------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    must_change_password = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

# ------------------------------------------------------------
# MODÈLE PARAMÈTRES
# ------------------------------------------------------------
class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(String(500), nullable=False)

# ------------------------------------------------------------
# MODÈLE JOURNAL DE CONNEXION
# ------------------------------------------------------------
class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    login_time = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)

    user = relationship("User")

# ------------------------------------------------------------
# MODÈLE DOCUMENT
# ------------------------------------------------------------
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    content_type = Column(String(100), nullable=True)
    size = Column(Integer, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)

# ------------------------------------------------------------
# MODÈLES POUR FACTURATION CLIENT
# ------------------------------------------------------------
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    invoices = relationship("Invoice", back_populates="client")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    total_ht = Column(Numeric(10, 2), default=0)
    tva_rate = Column(Numeric(5, 2), default=16.00)
    total_ttc = Column(Numeric(10, 2), default=0)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    notes = Column(String(500), nullable=True)

    client = relationship("Client", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="lines")

# ------------------------------------------------------------
# MODÈLES POUR ACHATS ET FOURNISSEURS
# ------------------------------------------------------------
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    expected_date = Column(Date, nullable=True)
    total = Column(Numeric(10, 2), default=0)
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.PENDING)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    lines = relationship("PurchaseOrderLine", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="lines")

# ------------------------------------------------------------
# MODÈLES POUR PAIE COMPLÈTE (PRIMES ET AVANCES)
# ------------------------------------------------------------
class Prime(Base):
    __tablename__ = "primes"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(200), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    month = Column(String(7), nullable=False)

    employee = relationship("Employee", back_populates="primes")

class Avance(Base):
    __tablename__ = "avances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    date = Column(Date, nullable=False)
    deducted = Column(Boolean, default=False)
    reason = Column(String(200), nullable=True)

    employee = relationship("Employee", back_populates="avances")