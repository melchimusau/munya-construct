from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional, List
from decimal import Decimal
from .models import EmployeeStatus, MovementType, TransactionType, UserRole, ContractType, InvoiceStatus, PurchaseOrderStatus

# ------------------------------------------------------------
# EMPLOYÉS
# ------------------------------------------------------------
class EmployeeBase(BaseModel):
    full_name: str
    role: str
    status: EmployeeStatus = EmployeeStatus.ACTIF
    base_salary: Decimal
    email: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# POINTAGES
# ------------------------------------------------------------
class AttendanceRecordCreate(BaseModel):
    employee_id: int
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: str = "absent"

class AttendanceRecordResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# CONTRATS
# ------------------------------------------------------------
class ContractCreate(BaseModel):
    employee_id: int
    contract_type: str
    start_date: date
    end_date: Optional[date] = None
    trial_end_date: Optional[date] = None
    salary: Decimal
    notes: Optional[str] = None

class ContractResponse(ContractCreate):
    id: int
    document_path: Optional[str] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# STOCK
# ------------------------------------------------------------
class StockItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: int = 0
    unit_price: Decimal

class StockItemCreate(StockItemBase):
    pass

class StockItemResponse(StockItemBase):
    id: int

    class Config:
        from_attributes = True

class StockMovementResponse(BaseModel):
    id: int
    movement_date: date
    movement_type: MovementType
    item_id: int
    quantity: int
    reason: Optional[str] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# FINANCE
# ------------------------------------------------------------
class TransactionCreate(BaseModel):
    date: date
    description: str
    amount: Decimal
    type: TransactionType
    category: Optional[str] = None
    reference: Optional[str] = None
class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    reference: Optional[str] = None

class TransactionResponse(TransactionCreate):
    id: int
    created_by: Optional[int] = None
    is_edited: bool = False
    edited_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FinancialSummary(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    recent_transactions: List[TransactionResponse]

# ------------------------------------------------------------
# PAIE
# ------------------------------------------------------------
class PayrollInput(BaseModel):
    start_date: date
    end_date: date

class PayrollEmployee(BaseModel):
    employee_id: int
    full_name: str
    base_salary: float
    days_worked: int
    regular_hours: float
    overtime_hours: float
    gross_salary: float
    cnss: float
    inpp: float
    ipr: float
    net_salary: float

# Primes et avances
class PrimeCreate(BaseModel):
    employee_id: int
    description: str
    amount: Decimal
    month: str

class PrimeResponse(PrimeCreate):
    id: int

    class Config:
        from_attributes = True

class AvanceCreate(BaseModel):
    employee_id: int
    amount: Decimal
    date: date
    reason: Optional[str] = None

class AvanceResponse(AvanceCreate):
    id: int
    deducted: bool

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# UTILISATEURS
# ------------------------------------------------------------
class UserCreate(BaseModel):
    email: str
    password: Optional[str] = None
    role: str
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    username: str
    temporary_password: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# ------------------------------------------------------------
# PARAMÈTRES
# ------------------------------------------------------------
class SettingResponse(BaseModel):
    key: str
    value: str

class SettingUpdate(BaseModel):
    value: str

# ------------------------------------------------------------
# JOURNAL DE CONNEXION
# ------------------------------------------------------------
class LoginHistoryResponse(BaseModel):
    id: int
    user_id: int
    login_time: datetime
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# DOCUMENTS
# ------------------------------------------------------------
class DocumentResponse(BaseModel):
    id: int
    filename: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    uploaded_by: Optional[int] = None
    upload_date: datetime

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# CLIENTS ET FACTURES
# ------------------------------------------------------------
class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class ClientResponse(ClientCreate):
    id: int

    class Config:
        from_attributes = True

class InvoiceLineCreate(BaseModel):
    description: str
    quantity: int
    unit_price: Decimal

class InvoiceLineResponse(BaseModel):
    id: int
    invoice_id: int
    description: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    client_id: int
    issue_date: date
    due_date: Optional[date] = None
    notes: Optional[str] = None
    lines: List[InvoiceLineCreate]

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    client_id: int
    issue_date: date
    due_date: Optional[date] = None
    total_ht: Decimal
    tva_rate: Decimal
    total_ttc: Decimal
    status: str
    notes: Optional[str] = None
    lines: List[InvoiceLineResponse]

    class Config:
        from_attributes = True

# ------------------------------------------------------------
# FOURNISSEURS ET ACHATS
# ------------------------------------------------------------
class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierResponse(SupplierCreate):
    id: int

    class Config:
        from_attributes = True

class PurchaseOrderLineCreate(BaseModel):
    description: str
    quantity: int
    unit_price: Decimal

class PurchaseOrderLineResponse(BaseModel):
    id: int
    purchase_order_id: int
    description: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    order_date: date
    expected_date: Optional[date] = None
    lines: List[PurchaseOrderLineCreate]

class PurchaseOrderResponse(BaseModel):
    id: int
    order_number: str
    supplier_id: int
    order_date: date
    expected_date: Optional[date] = None
    total: Decimal
    status: str
    lines: List[PurchaseOrderLineResponse]

    class Config:
        from_attributes = True