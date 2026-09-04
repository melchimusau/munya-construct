import React, { useState, useEffect } from 'react';
import './App.css';
import logoMunya from './assets/logo.png';
import {
  Users, CreditCard, TrendingUp, FileText, Settings,
  DollarSign, Clock, Download, Menu, X,
  CalendarCheck, FolderOpen,
  Briefcase, BarChart3, ShoppingCart,
  Award, HandCoins, Building2
} from 'lucide-react';
import { apiService, setAuthToken } from './services/api';
import type { User } from './services/api';

// Composants externes
import DashboardView from './components/DashboardView';
import EmployeesView from './components/EmployeesView';
import PayrollView from './components/PayrollView';
import AttendanceView from './components/AttendanceView';
import StockView from './components/StockView';
import DailyReportView from './components/DailyReportView';
import FinanceView from './components/FinanceView';
import AttendanceHistory from './components/AttendanceHistory';
import ResetPasswordView from './components/ResetPasswordView';
import AdminSettings from './components/AdminSettings';
import AdminLoginHistory from './components/AdminLoginHistory';
import AdminExports from './components/AdminExports';
import DocumentsView from './components/DocumentsView';
import ClientsView from './components/ClientsView';
import InvoicesList from './components/InvoicesList';
import SuppliersView from './components/SuppliersView';
import PurchaseOrdersView from './components/PurchaseOrdersView';
import PrimesView from './components/PrimesView';
import AvancesView from './components/AvancesView';
import DecisionDashboard from './components/DecisionDashboard';
import EmployeePortal from './components/EmployeePortal';

// Types locaux
interface EmployeeFE {
  id: number;
  name: string;
  role: string;
  status: 'Actif' | 'Essai' | 'Inactif';
  salary: string;
}

interface DailyReport {
  date: string;
  content: string;
}

interface StockItemFE {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

interface StockMovementFE {
  id: number;
  date: string;
  type: 'entrée' | 'sortie';
  itemId: number;
  quantity: number;
  reason?: string;
}

// Contexte d'authentification
const AuthContext = React.createContext<{
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}>(null!);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Utilisation d'apiService.login (qui pointe vers l'URL de production)
  const login = async (username: string, password: string) => {
    const data = await apiService.login(username, password);
    setAuthToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error('ErrorBoundary:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h3 className="text-lg font-bold text-red-600 mb-2">Une erreur est survenue dans ce composant.</h3>
          <p className="text-sm text-slate-600">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Réessayer</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminUsersView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'rh' });
  const fetchUsers = async () => { try { setUsers(await apiService.getUsers()); } catch {} };
  useEffect(() => { fetchUsers(); }, []);
  const handleCreate = async () => {
    if (!form.full_name || !form.email) return alert('Nom et email requis');
    try {
      const newUser = await apiService.createUser(form);
      alert(`✅ Utilisateur créé.\nEmail : ${newUser.email}\nMot de passe temporaire : ${newUser.temporary_password}`);
      setForm({ full_name: '', email: '', role: 'rh' });
      fetchUsers();
    } catch { alert('Erreur création'); }
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <h3 className="text-xl font-bold mb-4">Créer un utilisateur</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Nom complet" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="border rounded px-3 py-2" />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border rounded px-3 py-2" />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border rounded px-3 py-2">
            <option value="admin">Admin</option>
            <option value="rh">RH</option>
            <option value="pdg">PDG</option>
            <option value="employee">Employé</option>
          </select>
        </div>
        <button onClick={handleCreate} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Créer</button>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">Liste des utilisateurs</h3>
        <table className="w-full text-left border-collapse">
          <thead><tr className="border-b"><th>Nom</th><th>Email</th><th>Rôle</th></tr></thead>
          <tbody>{users.map(u => (<tr key={u.id} className="border-b"><td className="py-2">{u.full_name}</td><td>{u.username}</td><td>{u.role}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (user?.must_change_password) {
    return <ResetPasswordView onPasswordChanged={() => window.location.reload()} />;
  }
  if (user?.role === 'employee') {
    return <EmployeePortal />;
  }

  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<EmployeeFE[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    try { return JSON.parse(localStorage.getItem('munya_daily_reports') || '[]'); } catch { return []; }
  });
  const [stockItems, setStockItems] = useState<StockItemFE[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementFE[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const [emps, stock, movements] = await Promise.all([
          apiService.getEmployees(),
          apiService.getStock(),
          apiService.getStockMovements(),
        ]);
        setEmployees(emps.map(e => ({ id: e.id, name: e.full_name, role: e.role, status: e.status, salary: `${e.base_salary} $` })));
        setStockItems(stock.map(s => ({ id: s.id, name: s.name, quantity: s.quantity, unitPrice: Number(s.unit_price), description: s.description })));
        setStockMovements(movements.map(m => ({ id: m.id, date: m.movement_date, type: m.movement_type === 'ENTREE' ? 'entrée' : 'sortie', itemId: m.item_id, quantity: m.quantity, reason: m.reason })));
      } catch (err) { console.error(err); }
    })();
  }, [isAuthenticated]);

  useEffect(() => { localStorage.setItem('munya_daily_reports', JSON.stringify(dailyReports)); }, [dailyReports]);

  const handleAddEmployee = async (emp: Omit<EmployeeFE, 'id'>) => {
    try {
      const created = await apiService.createEmployee({ full_name: emp.name, role: emp.role, status: emp.status, base_salary: parseFloat(emp.salary) || 0 });
      setEmployees(prev => [...prev, { id: created.id, name: created.full_name, role: created.role, status: created.status, salary: `${created.base_salary} $` }]);
    } catch { alert('Erreur ajout employé'); }
  };

  const handleUpdateEmployee = (id: number, emp: Partial<EmployeeFE>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...emp, salary: emp.salary || e.salary } : e));
  };

  const handleDeleteEmployee = async (id: number) => {
    try { await apiService.deleteEmployee(id); setEmployees(prev => prev.filter(e => e.id !== id)); }
    catch { alert('Erreur suppression'); }
  };

  const handleSaveReport = (date: string, content: string) => {
    setDailyReports(prev => [...prev.filter(r => r.date !== date), { date, content }]);
  };

  const handleRecordAttendance = async (empId: number, date: string, time: string, type: 'in' | 'out' | 'absent') => {
    try {
      if (type === 'in') await apiService.recordAttendance(empId, date, time, undefined);
      else if (type === 'out') await apiService.recordAttendance(empId, date, undefined, time);
      else await apiService.recordAttendance(empId, date, undefined, undefined, 'absent');
    } catch (err: any) { alert('Erreur pointage : ' + err.message); }
  };

  const handleAddItem = async (item: Omit<StockItemFE, 'id'>) => {
    try {
      const created = await apiService.createStockItem({ name: item.name, quantity: item.quantity, unit_price: item.unitPrice, description: item.description });
      setStockItems(prev => [...prev, { id: created.id, name: created.name, quantity: created.quantity, unitPrice: created.unit_price, description: created.description }]);
    } catch { alert('Erreur ajout matériau'); }
  };

  const handleUpdateQuantity = async (itemId: number, delta: number, reason: string) => {
    try {
      const updated = await apiService.updateStockQuantity(itemId, delta, reason);
      setStockItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: updated.quantity } : i));
      const movements = await apiService.getStockMovements();
      setStockMovements(movements.map(m => ({ id: m.id, date: m.movement_date, type: m.movement_type === 'ENTREE' ? 'entrée' : 'sortie', itemId: m.item_id, quantity: m.quantity, reason: m.reason })));
    } catch { alert('Erreur mise à jour stock'); }
  };

  const handleRecordSale = (itemId: number, quantity: number, client: string) => {
    handleUpdateQuantity(itemId, -quantity, `Vente à ${client}`);
  };

  if (!isAuthenticated) return <LoginView />;

  const tabs = [];
  tabs.push({ key: 'dashboard', label: 'Tableau de bord', icon: TrendingUp });
  if (user?.role === 'admin' || user?.role === 'rh') {
    tabs.push({ key: 'employees', label: 'Employés', icon: Users });
    tabs.push({ key: 'attendance', label: 'Présence', icon: CalendarCheck });
    tabs.push({ key: 'attendance-history', label: 'Historique Présence', icon: CalendarCheck });
    tabs.push({ key: 'payroll', label: 'Calcul de Paie', icon: CreditCard });
    tabs.push({ key: 'primes', label: 'Primes', icon: Award });
    tabs.push({ key: 'avances', label: 'Avances', icon: HandCoins });
  }
  if (user?.role === 'admin' || user?.role === 'pdg') {
    tabs.push({ key: 'finance', label: 'Finance', icon: DollarSign });
    tabs.push({ key: 'clients', label: 'Clients', icon: Briefcase });
    tabs.push({ key: 'invoices', label: 'Factures', icon: FileText });
    tabs.push({ key: 'suppliers', label: 'Fournisseurs', icon: Building2 });
    tabs.push({ key: 'purchase-orders', label: 'Achats', icon: ShoppingCart });
    tabs.push({ key: 'bi', label: 'Analyse (BI)', icon: BarChart3 });
  }
  tabs.push({ key: 'documents', label: 'Documents', icon: FolderOpen });
  if (user?.role === 'admin') {
    tabs.push({ key: 'admin', label: 'Utilisateurs', icon: Users });
    tabs.push({ key: 'settings', label: 'Paramètres', icon: Settings });
    tabs.push({ key: 'login-history', label: 'Connexions', icon: Clock });
    tabs.push({ key: 'exports', label: 'Exports', icon: Download });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView employees={employees} />;
      case 'employees': return <EmployeesView employees={employees} onAdd={handleAddEmployee} onUpdate={handleUpdateEmployee} onDelete={handleDeleteEmployee} />;
      case 'finance': return <FinanceView />;
      case 'payroll': return <PayrollView />;
      case 'reports': return <PayrollView />;
      case 'dailyreport': return <DailyReportView reports={dailyReports} onSaveReport={handleSaveReport} />;
      case 'attendance': return <AttendanceView employees={employees} onRecordAttendance={handleRecordAttendance} />;
      case 'attendance-history': return <AttendanceHistory />;
      case 'stock': return (
        <ErrorBoundary>
          <StockView stockItems={stockItems} movements={stockMovements} onAddItem={handleAddItem} onUpdateQuantity={handleUpdateQuantity} onRecordSale={handleRecordSale} />
        </ErrorBoundary>
      );
      case 'admin': return <AdminUsersView />;
      case 'settings': return <AdminSettings />;
      case 'login-history': return <AdminLoginHistory />;
      case 'exports': return <AdminExports />;
      case 'documents': return <DocumentsView />;
      case 'clients': return <ClientsView />;
      case 'invoices': return <InvoicesList />;
      case 'suppliers': return <SuppliersView />;
      case 'purchase-orders': return <PurchaseOrdersView />;
      case 'primes': return <PrimesView />;
      case 'avances': return <AvancesView />;
      case 'bi': return <DecisionDashboard />;
      default: return <DashboardView employees={employees} />;
    }
  };

  const headerTitles: Record<string, string> = {
    dashboard: "Vue d'ensemble",
    employees: "Gestion des Employés",
    finance: "Gestion Financière",
    payroll: "Calcul de Paie",
    reports: "Bulletins de Paie",
    dailyreport: "Rapport Journalier",
    attendance: "Présence Journalière",
    'attendance-history': "Historique des Présences",
    stock: "Gestion de Stock",
    admin: "Gestion des Utilisateurs",
    settings: "Paramètres Système",
    'login-history': "Journal des Connexions",
    exports: "Exports",
    documents: "Gestion des Documents",
    clients: "Clients",
    invoices: "Factures",
    suppliers: "Fournisseurs",
    'purchase-orders': "Achats",
    primes: "Primes",
    avances: "Avances",
    bi: "Analyse Décisionnelle",
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-white/95 p-1.5 rounded-lg shadow-sm shrink-0"><img src={logoMunya} alt="Logo" className="w-20 h-auto object-contain" /></div>
        <div><h1 className="font-bold text-lg tracking-wide">Munya Paie</h1><span className="text-xs text-slate-400">RH & Payroll Local</span></div>
      </div>
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 mb-2">{user?.full_name} ({user?.role})</div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col justify-between shrink-0">{sidebarContent}</aside>
      <div className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebarContent}</div>
      <main className="flex-1 overflow-y-auto flex flex-col w-full lg:w-auto">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={24} /> : <Menu size={24} />}</button>
            <h2 className="font-semibold text-lg md:text-xl text-slate-900 capitalize">{headerTitles[activeTab] || ''}</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:block text-right"><p className="text-xs text-slate-400">Connecté en tant que</p><p className="text-sm font-semibold text-slate-700">{user?.full_name}</p></div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200">AD</div>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {renderContent()}
          <div className="text-center text-xs text-slate-400 pt-8 pb-4">Munya Paie Desktop Application v1.0.0 — Lubumbashi, Haut-Katanga</div>
        </div>
      </main>
    </div>
  );
}

const LoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); try { await login(username, password); } catch { setError('Identifiants incorrects'); } };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6"><img src={logoMunya} alt="Logo" className="w-24 mx-auto mb-4" /><h2 className="text-2xl font-bold">Connexion</h2></div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">Se connecter</button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}