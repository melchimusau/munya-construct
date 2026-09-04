const API_BASE_URL = "https://munya-construct.onrender.com";

export interface Employee {
  id: number;
  full_name: string;
  role: string;
  status: 'Actif' | 'Essai' | 'Inactif';
  base_salary: number;
  email?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
}

export interface StockItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

export interface StockMovement {
  id: number;
  movement_date: string;
  movement_type: string;
  item_id: number;
  quantity: number;
  reason?: string;
}

export interface PayrollEmployee {
  employee_id: number;
  full_name: string;
  base_salary: number;
  days_worked: number;
  regular_hours: number;
  overtime_hours: number;
  gross_salary: number;
  cnss: number;
  inpp: number;
  ipr: number;
  net_salary: number;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  reference?: string;
  created_by?: number;
  is_edited?: boolean;
  edited_at?: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  recent_transactions: Transaction[];
}

export interface User {
  id: number;
  username: string;
  role: string;
  full_name: string;
  email: string;
  must_change_password: boolean;
  is_active: boolean;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoiceLine {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  issue_date: string;
  due_date?: string;
  total_ht: number;
  tva_rate: number;
  total_ttc: number;
  status: string;
  notes?: string;
  lines: InvoiceLine[];
}

// Type pour la création de lignes de facture (sans id/line_total)
export interface InvoiceLineCreate {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PurchaseOrderLine {
  id: number;
  purchase_order_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  order_date: string;
  expected_date?: string;
  total: number;
  status: string;
  lines: PurchaseOrderLine[];
}

// Type pour la création de lignes de commande d'achat
export interface PurchaseOrderLineCreate {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Prime {
  id: number;
  employee_id: number;
  description: string;
  amount: number;
  month: string;
}

export interface Avance {
  id: number;
  employee_id: number;
  amount: number;
  date: string;
  deducted: boolean;
  reason?: string;
}

export interface DocumentItem {
  id: number;
  filename: string;
  content_type: string;
  size: number;
  upload_date: string;
}

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

const headers = (): Record<string, string> => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) h["Authorization"] = `Bearer ${authToken}`;
  return h;
};

const handleUnauthorized = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  setAuthToken(null);
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  }
};

export const apiService = {
  // AUTH
  async login(username: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    if (!res.ok) throw new Error('Échec de connexion');
    const data = await res.json();
    setAuthToken(data.access_token);
    return data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erreur' }));
      throw new Error(err.detail || 'Erreur changement mot de passe');
    }
  },

  // USERS
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/users`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement utilisateurs');
    return res.json();
  },

  async createUser(userData: { full_name: string; email: string; role: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(userData),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création utilisateur');
    return res.json();
  },

  // EMPLOYEES
  async getEmployees(): Promise<Employee[]> {
    const res = await fetch(`${API_BASE_URL}/employees`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement employés');
    return res.json();
  },

  async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(employee),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création employé');
    return res.json();
  },

  async deleteEmployee(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'DELETE', headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur suppression employé');
  },

  // ATTENDANCE
  async recordAttendance(employee_id: number, date: string, check_in?: string, check_out?: string, status?: string): Promise<AttendanceRecord> {
    const body: any = { employee_id, date };
    if (check_in) body.check_in = check_in;
    if (check_out) body.check_out = check_out;
    if (status) body.status = status;
    const res = await fetch(`${API_BASE_URL}/attendance/record`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur pointage');
    return res.json();
  },

  async getAttendance(dateStr: string): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/${dateStr}`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement présences');
    return res.json();
  },

  // PAYROLL
  async calculatePayroll(startDate: string, endDate: string): Promise<PayrollEmployee[]> {
    const res = await fetch(`${API_BASE_URL}/payroll/calculate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur calcul paie');
    return res.json();
  },

  // PRIMES & AVANCES
  async createPrime(prime: Omit<Prime, 'id'>): Promise<Prime> {
    const res = await fetch(`${API_BASE_URL}/primes`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(prime),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création prime');
    return res.json();
  },

  async getPrimes(month?: string): Promise<Prime[]> {
    const url = month ? `${API_BASE_URL}/primes?month=${month}` : `${API_BASE_URL}/primes`;
    const res = await fetch(url, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement primes');
    return res.json();
  },

  async createAvance(avance: Omit<Avance, 'id' | 'deducted'>): Promise<Avance> {
    const res = await fetch(`${API_BASE_URL}/avances`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(avance),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création avance');
    return res.json();
  },

  async getAvances(employeeId?: number): Promise<Avance[]> {
    const url = employeeId ? `${API_BASE_URL}/avances?employee_id=${employeeId}` : `${API_BASE_URL}/avances`;
    const res = await fetch(url, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement avances');
    return res.json();
  },

  // STOCK
  async getStock(): Promise<StockItem[]> {
    const res = await fetch(`${API_BASE_URL}/stock`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement stock');
    return res.json();
  },

  async createStockItem(item: Omit<StockItem, 'id'>): Promise<StockItem> {
    const res = await fetch(`${API_BASE_URL}/stock`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(item),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création article stock');
    return res.json();
  },

  async updateStockQuantity(itemId: number, delta: number, reason: string): Promise<StockItem> {
    const res = await fetch(`${API_BASE_URL}/stock/${itemId}/quantity?delta=${delta}&reason=${encodeURIComponent(reason)}`, {
      method: 'PATCH',
      headers: headers(),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur mise à jour stock');
    return res.json();
  },

  async getStockMovements(): Promise<StockMovement[]> {
    const res = await fetch(`${API_BASE_URL}/stock/movements`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement mouvements stock');
    return res.json();
  },

  // FINANCE
  async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création transaction');
    return res.json();
  },

  async getTransactions(skip = 0, limit = 50): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE_URL}/transactions?skip=${skip}&limit=${limit}`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement transactions');
    return res.json();
  },

  async updateTransaction(id: number, data: any): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erreur' }));
      throw new Error(err.detail || 'Erreur modification transaction');
    }
    return res.json();
  },

  async getFinancialSummary(): Promise<FinancialSummary> {
    const res = await fetch(`${API_BASE_URL}/financial-summary`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur résumé financier');
    return res.json();
  },

  // CLIENTS
  async createClient(client: Omit<Client, 'id'>): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(client),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création client');
    return res.json();
  },

  async getClients(): Promise<Client[]> {
    const res = await fetch(`${API_BASE_URL}/clients`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement clients');
    return res.json();
  },

  // FACTURES
  async createInvoice(invoice: {
    client_id: number;
    issue_date: string;
    due_date?: string;
    notes?: string;
    lines: InvoiceLineCreate[];
  }): Promise<Invoice> {
    const res = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(invoice),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création facture');
    return res.json();
  },

  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch(`${API_BASE_URL}/invoices`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement factures');
    return res.json();
  },

  // FOURNISSEURS
  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const res = await fetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(supplier),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création fournisseur');
    return res.json();
  },

  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${API_BASE_URL}/suppliers`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement fournisseurs');
    return res.json();
  },

  // COMMANDES D'ACHAT
  async createPurchaseOrder(po: {
    supplier_id: number;
    order_date: string;
    expected_date?: string;
    lines: PurchaseOrderLineCreate[];
  }): Promise<PurchaseOrder> {
    const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(po),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur création commande achat');
    return res.json();
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const res = await fetch(`${API_BASE_URL}/purchase-orders`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement commandes achat');
    return res.json();
  },

  // PORTAIL EMPLOYÉ
  async getMyInfo(): Promise<Employee> {
    const res = await fetch(`${API_BASE_URL}/me`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement infos employé');
    return res.json();
  },

  async getMyAttendance(): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/me/attendance`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement présences employé');
    return res.json();
  },

  async getMyContracts(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/me/contracts`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement contrats employé');
    return res.json();
  },

  async getMyPayslips(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/me/payslips`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement bulletins employé');
    return res.json();
  },

  // BI
  async getSalesMonthly(): Promise<{ month: string; total: number }[]> {
    const res = await fetch(`${API_BASE_URL}/bi/sales-monthly`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement ventes mensuelles');
    return res.json();
  },

  async getExpensesByCategory(): Promise<{ category: string; total: number }[]> {
    const res = await fetch(`${API_BASE_URL}/bi/expenses-by-category`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement dépenses par catégorie');
    return res.json();
  },

  async getTopProducts(): Promise<{ name: string; quantity: number }[]> {
    const res = await fetch(`${API_BASE_URL}/bi/top-products`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement top produits');
    return res.json();
  },

  // DOCUMENTS
  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur upload document');
    return res.json();
  },

  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE_URL}/documents`, { headers: headers() });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur chargement documents');
    return res.json();
  },

  async downloadDocument(id: number): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur téléchargement document');
    return res.blob();
  },

  async deleteDocument(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (res.status === 401) { handleUnauthorized(); throw new Error('Session expirée'); }
    if (!res.ok) throw new Error('Erreur suppression document');
  },
};