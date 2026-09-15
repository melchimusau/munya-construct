const API_BASE_URL = "https://munya-construct.onrender.com";

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

let authToken: string | null =
  typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
};

const handleUnauthorized = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  setAuthToken(null);
  if (window.location.pathname !== '/') window.location.href = '/';
};

// ============================================================================
// REQUEST HELPER
// ============================================================================

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  query?: Record<string, QueryValue>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method || 'GET';

  let url = `${API_BASE_URL}${path}`;
  if (opts.query) {
    const parts: string[] = [];
    for (const key of Object.keys(opts.query)) {
      const value = opts.query[key];
      if (value !== undefined && value !== null) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    if (parts.length > 0) url += `?${parts.join('&')}`;
  }

  const h: Record<string, string> = {};
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;

  let payload: BodyInit | undefined;
  if (opts.formData) {
    payload = opts.formData;
  } else if (opts.body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(opts.body);
  }

  const res = await fetch(url, { method, headers: h, body: payload });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expirée');
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let detail = `Erreur ${res.status}`;
    try {
      const err = await res.json();
      if (err && err.detail) detail = err.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.indexOf('application/json') === -1) return undefined as T;
  return (await res.json()) as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const h: Record<string, string> = {};
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: h });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expirée');
  }
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.blob();
}

// ============================================================================
// API SERVICE
// ============================================================================

export const apiService = {
  // --------------------------------------------------------------------------
  // AUTHENTIFICATION
  // --------------------------------------------------------------------------
  async login(
    username: string,
    password: string
  ): Promise<{ access_token: string; token_type: string; user: User }> {
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

  changePassword: (oldPassword: string, newPassword: string): Promise<void> =>
    request('/change-password', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    }),

  // --------------------------------------------------------------------------
  // UTILISATEURS (admin)
  // --------------------------------------------------------------------------
  getUsers: (): Promise<User[]> => request('/users'),

  getUser: (id: number): Promise<User> => request(`/users/${id}`),

  createUser: (userData: { full_name: string; email: string; role: string }) =>
    request<{ id: number; email: string; temporary_password: string }>('/users', {
      method: 'POST',
      body: userData,
    }),

  updateUser: (
    id: number,
    payload: Partial<Pick<User, 'full_name' | 'email' | 'role' | 'is_active'>>
  ): Promise<User> => request(`/users/${id}`, { method: 'PATCH', body: payload }),

  deleteUser: (id: number): Promise<void> =>
    request(`/users/${id}`, { method: 'DELETE' }),

  resetUserPassword: (
    userId: number
  ): Promise<{ email: string; temporary_password: string }> =>
    request(`/users/${userId}/reset-password`, { method: 'POST' }),

  // --------------------------------------------------------------------------
  // EMPLOYÉS
  // --------------------------------------------------------------------------
  getEmployees: (): Promise<Employee[]> => request('/employees'),

  getEmployee: (id: number): Promise<Employee> => request(`/employees/${id}`),

  createEmployee: (employee: Omit<Employee, 'id'>): Promise<Employee> =>
    request('/employees', { method: 'POST', body: employee }),

  updateEmployee: (
    id: number,
    payload: Partial<Omit<Employee, 'id'>>
  ): Promise<Employee> =>
    request(`/employees/${id}`, { method: 'PATCH', body: payload }),

  deleteEmployee: (id: number): Promise<void> =>
    request(`/employees/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // POINTAGES
  // --------------------------------------------------------------------------
  recordAttendance: (
    employee_id: number,
    date: string,
    check_in?: string,
    check_out?: string,
    status?: string
  ): Promise<AttendanceRecord> =>
    request('/attendance/record', {
      method: 'POST',
      body: { employee_id, date, check_in, check_out, status },
    }),

  getAttendance: (dateStr: string): Promise<AttendanceRecord[]> =>
    request(`/attendance/${dateStr}`),

  getAttendanceHistory: (params?: {
    employee_id?: number;
    from?: string;
    to?: string;
  }): Promise<AttendanceRecord[]> =>
    request('/attendance/history', { query: params }),

  // --------------------------------------------------------------------------
  // PAIE
  // --------------------------------------------------------------------------
  calculatePayroll: (
    startDate: string,
    endDate: string
  ): Promise<PayrollEmployee[]> =>
    request('/payroll/calculate', {
      method: 'POST',
      body: { start_date: startDate, end_date: endDate },
    }),

  // --------------------------------------------------------------------------
  // PRIMES
  // --------------------------------------------------------------------------
  getPrimes: (month?: string): Promise<Prime[]> =>
    request('/primes', { query: month ? { month } : undefined }),

  getPrime: (id: number): Promise<Prime> => request(`/primes/${id}`),

  createPrime: (prime: Omit<Prime, 'id'>): Promise<Prime> =>
    request('/primes', { method: 'POST', body: prime }),

  updatePrime: (id: number, payload: Partial<Omit<Prime, 'id'>>): Promise<Prime> =>
    request(`/primes/${id}`, { method: 'PATCH', body: payload }),

  deletePrime: (id: number): Promise<void> =>
    request(`/primes/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // AVANCES
  // --------------------------------------------------------------------------
  getAvances: (employeeId?: number): Promise<Avance[]> =>
    request('/avances', {
      query: employeeId ? { employee_id: employeeId } : undefined,
    }),

  getAvance: (id: number): Promise<Avance> => request(`/avances/${id}`),

  createAvance: (avance: Omit<Avance, 'id' | 'deducted'>): Promise<Avance> =>
    request('/avances', { method: 'POST', body: avance }),

  updateAvance: (
    id: number,
    payload: Partial<Omit<Avance, 'id'>>
  ): Promise<Avance> =>
    request(`/avances/${id}`, { method: 'PATCH', body: payload }),

  markAvanceDeducted: (id: number): Promise<Avance> =>
    request(`/avances/${id}/deduct`, { method: 'PATCH' }),

  deleteAvance: (id: number): Promise<void> =>
    request(`/avances/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // STOCK
  // --------------------------------------------------------------------------
  getStock: (): Promise<StockItem[]> => request('/stock'),

  getStockItem: (id: number): Promise<StockItem> => request(`/stock/${id}`),

  createStockItem: (item: Omit<StockItem, 'id'>): Promise<StockItem> =>
    request('/stock', { method: 'POST', body: item }),

  updateStockItem: (
    id: number,
    payload: Partial<Omit<StockItem, 'id'>>
  ): Promise<StockItem> =>
    request(`/stock/${id}`, { method: 'PATCH', body: payload }),

  updateStockQuantity: (
    itemId: number,
    delta: number,
    reason: string
  ): Promise<StockItem> =>
    request(`/stock/${itemId}/quantity`, {
      method: 'PATCH',
      query: { delta, reason },
    }),

  deleteStockItem: (id: number): Promise<void> =>
    request(`/stock/${id}`, { method: 'DELETE' }),

  getStockMovements: (itemId?: number): Promise<StockMovement[]> =>
    request('/stock/movements', {
      query: itemId ? { item_id: itemId } : undefined,
    }),

  // --------------------------------------------------------------------------
  // FINANCE
  // --------------------------------------------------------------------------
  createTransaction: (data: Omit<Transaction, 'id'>): Promise<Transaction> =>
    request('/transactions', { method: 'POST', body: data }),

  getTransactions: (skip = 0, limit = 50): Promise<Transaction[]> =>
    request('/transactions', { query: { skip, limit } }),

  getTransaction: (id: number): Promise<Transaction> =>
    request(`/transactions/${id}`),

  updateTransaction: (
    id: number,
    data: Partial<Omit<Transaction, 'id'>>
  ): Promise<Transaction> =>
    request(`/transactions/${id}`, { method: 'PATCH', body: data }),

  deleteTransaction: (id: number): Promise<void> =>
    request(`/transactions/${id}`, { method: 'DELETE' }),

  getFinancialSummary: (): Promise<FinancialSummary> =>
    request('/financial-summary'),

  // --------------------------------------------------------------------------
  // CLIENTS
  // --------------------------------------------------------------------------
  getClients: (): Promise<Client[]> => request('/clients'),

  getClient: (id: number): Promise<Client> => request(`/clients/${id}`),

  createClient: (client: Omit<Client, 'id'>): Promise<Client> =>
    request('/clients', { method: 'POST', body: client }),

  updateClient: (
    id: number,
    payload: Partial<Omit<Client, 'id'>>
  ): Promise<Client> =>
    request(`/clients/${id}`, { method: 'PATCH', body: payload }),

  deleteClient: (id: number): Promise<void> =>
    request(`/clients/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // FACTURES
  // --------------------------------------------------------------------------
  getInvoices: (): Promise<Invoice[]> => request('/invoices'),

  getInvoice: (id: number): Promise<Invoice> => request(`/invoices/${id}`),

  createInvoice: (invoice: {
    client_id: number;
    issue_date: string;
    due_date?: string;
    notes?: string;
    lines: InvoiceLineCreate[];
  }): Promise<Invoice> =>
    request('/invoices', { method: 'POST', body: invoice }),

  updateInvoice: (
    id: number,
    payload: Partial<{
      client_id: number;
      issue_date: string;
      due_date: string;
      notes: string;
      status: string;
      lines: InvoiceLineCreate[];
    }>
  ): Promise<Invoice> =>
    request(`/invoices/${id}`, { method: 'PATCH', body: payload }),

  deleteInvoice: (id: number): Promise<void> =>
    request(`/invoices/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // FOURNISSEURS
  // --------------------------------------------------------------------------
  getSuppliers: (): Promise<Supplier[]> => request('/suppliers'),

  getSupplier: (id: number): Promise<Supplier> => request(`/suppliers/${id}`),

  createSupplier: (supplier: Omit<Supplier, 'id'>): Promise<Supplier> =>
    request('/suppliers', { method: 'POST', body: supplier }),

  updateSupplier: (
    id: number,
    payload: Partial<Omit<Supplier, 'id'>>
  ): Promise<Supplier> =>
    request(`/suppliers/${id}`, { method: 'PATCH', body: payload }),

  deleteSupplier: (id: number): Promise<void> =>
    request(`/suppliers/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // COMMANDES D'ACHAT
  // --------------------------------------------------------------------------
  getPurchaseOrders: (): Promise<PurchaseOrder[]> =>
    request('/purchase-orders'),

  getPurchaseOrder: (id: number): Promise<PurchaseOrder> =>
    request(`/purchase-orders/${id}`),

  createPurchaseOrder: (po: {
    supplier_id: number;
    order_date: string;
    expected_date?: string;
    lines: PurchaseOrderLineCreate[];
  }): Promise<PurchaseOrder> =>
    request('/purchase-orders', { method: 'POST', body: po }),

  updatePurchaseOrder: (
    id: number,
    payload: Partial<{
      supplier_id: number;
      order_date: string;
      expected_date: string;
      status: string;
      lines: PurchaseOrderLineCreate[];
    }>
  ): Promise<PurchaseOrder> =>
    request(`/purchase-orders/${id}`, { method: 'PATCH', body: payload }),

  deletePurchaseOrder: (id: number): Promise<void> =>
    request(`/purchase-orders/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // PORTAIL EMPLOYÉ
  // --------------------------------------------------------------------------
  getMyInfo: (): Promise<Employee> => request('/me'),

  getMyAttendance: (): Promise<AttendanceRecord[]> =>
    request('/me/attendance'),

  getMyContracts: (): Promise<any[]> => request('/me/contracts'),

  getMyPayslips: (): Promise<any[]> => request('/me/payslips'),

  // --------------------------------------------------------------------------
  // BI
  // --------------------------------------------------------------------------
  getSalesMonthly: (): Promise<{ month: string; total: number }[]> =>
    request('/bi/sales-monthly'),

  getExpensesByCategory: (): Promise<{ category: string; total: number }[]> =>
    request('/bi/expenses-by-category'),

  getTopProducts: (): Promise<{ name: string; quantity: number }[]> =>
    request('/bi/top-products'),

  // --------------------------------------------------------------------------
  // DOCUMENTS
  // --------------------------------------------------------------------------
  uploadDocument: (file: File): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/documents', { method: 'POST', formData });
  },

  getDocuments: (): Promise<DocumentItem[]> => request('/documents'),

  downloadDocument: (id: number): Promise<Blob> =>
    requestBlob(`/documents/${id}/download`),

  deleteDocument: (id: number): Promise<void> =>
    request(`/documents/${id}`, { method: 'DELETE' }),
};