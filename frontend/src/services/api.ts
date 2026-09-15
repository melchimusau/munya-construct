const API_BASE_URL = "https://munya-construct.onrender.com";

// ============================================================================
// Types (identiques à avant, plus les nouveaux)
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
// Token management
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
// Request helper — centralise auth, 401, parsing d'erreur
// ============================================================================

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  query?: Record<string, QueryValue>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query } = opts;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const h: Record<string, string> = {};
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;

  let payload: BodyInit | undefined;
  if (formData) {
    // ⚠️  On ne met PAS Content-Type : le navigateur ajoute le boundary.
    payload = formData;
  } else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers: h, body: payload });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expirée');
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: `Erreur ${res.status}` }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return undefined as T;
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
// apiService
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

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return request('/change-password', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    });
  },

  // --------------------------------------------------------------------------
  // UTILISATEURS (admin)
  // --------------------------------------------------------------------------
  getUsers: () => request<User[]>('/users'),

  getUser: (id: number) => request<User>(`/users/${id}`),

  createUser: (userData: { full_name: string; email: string; role: string }) =>
    request<{ id: number; email: string; temporary_password: string }>('/users', {
      method: 'POST',
      body: userData,
    }),

  updateUser: (id: number, payload: Partial<Pick<User, 'full_name' | 'email' | 'role' | 'is_active'>>) =>
    request<User>(`/users/${id}`, { method: 'PATCH', body: payload }),

  deleteUser: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  resetUserPassword: (userId: number) =>
    request<{ email: string; temporary_password: string }>(
      `/users/${userId}/reset-password`,
      { method: 'POST' }
    ),

  // --------------------------------------------------------------------------
  // EMPLOYÉS
  // --------------------------------------------------------------------------
  getEmployees: () => request<Employee[]>('/employees'),

  getEmployee: (id: number) => request<Employee>(`/employees/${id}`),

  createEmployee: (employee: Omit<Employee, 'id'>) =>
    request<Employee>('/employees', { method: 'POST', body: employee }),

  // ✅ NOUVEAU — résout le bug #4 d'App.tsx
  updateEmployee: (
    id: number,
    payload: Partial<Omit<Employee, 'id'>>
  ) => request<Employee>(`/employees/${id}`, { method: 'PATCH', body: payload }),

  deleteEmployee: (id: number) =>
    request<void>(`/employees/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // POINTAGES
  // --------------------------------------------------------------------------
  recordAttendance: (
    employee_id: number,
    date: string,
    check_in?: string,
    check_out?: string,
    status?: string
  ) =>
    request<AttendanceRecord>('/attendance/record', {
      method: 'POST',
      body: { employee_id, date, check_in, check_out, status },
    }),

  getAttendance: (dateStr: string) =>
    request<AttendanceRecord[]>(`/attendance/${dateStr}`),

  getAttendanceHistory: (params?: {
    employee_id?: number;
    from?: string;
    to?: string;
  }) => request<AttendanceRecord[]>('/attendance/history', { query: params }),

  // --------------------------------------------------------------------------
  // PAIE
  // --------------------------------------------------------------------------
  calculatePayroll: (startDate: string, endDate: string) =>s
    request<PayrollEmployee[]>('/payroll/calculate', {
      method: 'POST',
      body: { start_date: startDate, end_date: endDate },
    }),

  // --------------------------------------------------------------------------
  // PRIMES
  // --------------------------------------------------------------------------
  getPrimes: (month?: string) =>
    request<Prime[]>('/primes', { query: month ? { month } : undefined }),

  getPrime: (id: number) => request<Prime>(`/primes/${id}`),

  createPrime: (prime: Omit<Prime, 'id'>) =>
    request<Prime>('/primes', { method: 'POST', body: prime }),

  updatePrime: (id: number, payload: Partial<Omit<Prime, 'id'>>) =>
    request<Prime>(`/primes/${id}`, { method: 'PATCH', body: payload }),

  deletePrime: (id: number) =>
    request<void>(`/primes/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // AVANCES
  // --------------------------------------------------------------------------
  getAvances: (employeeId?: number) =>
    request<Avance[]>('/avances', {
      query: employeeId ? { employee_id: employeeId } : undefined,
    }),

  getAvance: (id: number) => request<Avance>(`/avances/${id}`),

  createAvance: (avance: Omit<Avance, 'id' | 'deducted'>) =>
    request<Avance>('/avances', { method: 'POST', body: avance }),

  updateAvance: (
    id: number,
    payload: Partial<Omit<Avance, 'id'>>
  ) => request<Avance>(`/avances/${id}`, { method: 'PATCH', body: payload }),

  markAvanceDeducted: (id: number) =>
    request<Avance>(`/avances/${id}/deduct`, { method: 'PATCH' }),

  deleteAvance: (id: number) =>
    request<void>(`/avances/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // STOCK
  // --------------------------------------------------------------------------
  getStock: () => request<StockItem[]>('/stock'),

  getStockItem: (id: number) => request<StockItem>(`/stock/${id}`),

  createStockItem: (item: Omit<StockItem, 'id'>) =>
    request<StockItem>('/stock', { method: 'POST', body: item }),

  updateStockItem: (
    id: number,
    payload: Partial<Omit<StockItem, 'id'>>
  ) => request<StockItem>(`/stock/${id}`, { method: 'PATCH', body: payload }),

  updateStockQuantity: (itemId: number, delta: number, reason: string) =>
    request<StockItem>(`/stock/${itemId}/quantity`, {
      method: 'PATCH',
      query: { delta, reason },
    }),

  deleteStockItem: (id: number) =>
    request<void>(`/stock/${id}`, { method: 'DELETE' }),

  getStockMovements: (itemId?: number) =>
    request<StockMovement[]>('/stock/movements', {
      query: itemId ? { item_id: itemId } : undefined,
    }),

  // --------------------------------------------------------------------------
  // FINANCE
  // --------------------------------------------------------------------------
  createTransaction: (data: Omit<Transaction, 'id'>) =>
    request<Transaction>('/transactions', { method: 'POST', body: data }),

  getTransactions: (skip = 0, limit = 50) =>
    request<Transaction[]>('/transactions', { query: { skip, limit } }),

  getTransaction: (id: number) =>
    request<Transaction>(`/transactions/${id}`),

  updateTransaction: (id: number, data: Partial<Omit<Transaction, 'id'>>) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: data }),

  deleteTransaction: (id: number) =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' }),

  getFinancialSummary: () =>
    request<FinancialSummary>('/financial-summary'),

  // --------------------------------------------------------------------------
  // CLIENTS
  // --------------------------------------------------------------------------
  getClients: () => request<Client[]>('/clients'),

  getClient: (id: number) => request<Client>(`/clients/${id}`),

  createClient: (client: Omit<Client, 'id'>) =>
    request<Client>('/clients', { method: 'POST', body: client }),

  updateClient: (id: number, payload: Partial<Omit<Client, 'id'>>) =>
    request<Client>(`/clients/${id}`, { method: 'PATCH', body: payload }),

  deleteClient: (id: number) =>
    request<void>(`/clients/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // FACTURES
  // --------------------------------------------------------------------------
  getInvoices: () => request<Invoice[]>('/invoices'),

  getInvoice: (id: number) => request<Invoice>(`/invoices/${id}`),

  createInvoice: (invoice: {
    client_id: number;
    issue_date: string;
    due_date?: string;
    notes?: string;
    lines: InvoiceLineCreate[];
  }) => request<Invoice>('/invoices', { method: 'POST', body: invoice }),

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
  ) => request<Invoice>(`/invoices/${id}`, { method: 'PATCH', body: payload }),

  deleteInvoice: (id: number) =>
    request<void>(`/invoices/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // FOURNISSEURS
  // --------------------------------------------------------------------------
  getSuppliers: () => request<Supplier[]>('/suppliers'),

  getSupplier: (id: number) => request<Supplier>(`/suppliers/${id}`),

  createSupplier: (supplier: Omit<Supplier, 'id'>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: supplier }),

  updateSupplier: (id: number, payload: Partial<Omit<Supplier, 'id'>>) =>
    request<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: payload }),

  deleteSupplier: (id: number) =>
    request<void>(`/suppliers/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // COMMANDES D'ACHAT
  // --------------------------------------------------------------------------
  getPurchaseOrders: () => request<PurchaseOrder[]>('/purchase-orders'),

  getPurchaseOrder: (id: number) =>
    request<PurchaseOrder>(`/purchase-orders/${id}`),

  createPurchaseOrder: (po: {
    supplier_id: number;
    order_date: string;
    expected_date?: string;
    lines: PurchaseOrderLineCreate[];
  }) => request<PurchaseOrder>('/purchase-orders', { method: 'POST', body: po }),

  updatePurchaseOrder: (
    id: number,
    payload: Partial<{
      supplier_id: number;
      order_date: string;
      expected_date: string;
      status: string;
      lines: PurchaseOrderLineCreate[];
    }>
  ) => request<PurchaseOrder>(`/purchase-orders/${id}`, { method: 'PATCH', body: payload }),

  deletePurchaseOrder: (id: number) =>
    request<void>(`/purchase-orders/${id}`, { method: 'DELETE' }),

  // --------------------------------------------------------------------------
  // PORTAIL EMPLOYÉ
  // --------------------------------------------------------------------------
  getMyInfo: () => request<Employee>('/me'),

  getMyAttendance: () => request<AttendanceRecord[]>('/me/attendance'),

  getMyContracts: () => request<any[]>('/me/contracts'),

  getMyPayslips: () => request<any[]>('/me/payslips'),

  // --------------------------------------------------------------------------
  // BI
  // --------------------------------------------------------------------------
  getSalesMonthly: () =>
    request<{ month: string; total: number }[]>('/bi/sales-monthly'),

  getExpensesByCategory: () =>
    request<{ category: string; total: number }[]>('/bi/expenses-by-category'),

  getTopProducts: () =>
    request<{ name: string; quantity: number }[]>('/bi/top-products'),

  // --------------------------------------------------------------------------
  // DOCUMENTS
  // --------------------------------------------------------------------------
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<DocumentItem>('/documents', { method: 'POST', formData });
  },

  getDocuments: () => request<DocumentItem[]>('/documents'),

  downloadDocument: (id: number) => requestBlob(`/documents/${id}/download`),

  deleteDocument: (id: number) =>
    request<void>(`/documents/${id}`, { method: 'DELETE' }),
};