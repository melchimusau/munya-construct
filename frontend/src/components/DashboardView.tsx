import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, DollarSign, Wallet, Activity, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { apiService } from '../services/api';
import type { FinancialSummary, Transaction } from '../services/api';

interface EmployeeFE {
  id: number;
  name: string;
  role: string;
  status: string;
  salary: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardView({ employees }: { employees: EmployeeFE[] }) {
  const [finSummary, setFinSummary] = useState<FinancialSummary>({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
    recent_transactions: [],
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiService.getFinancialSummary(),
      apiService.getTransactions(0, 5), // 5 dernières transactions
    ])
      .then(([summary, trans]) => {
        setFinSummary(summary);
        setTransactions(trans);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Calculs
  const totalEmployees = employees.length;
  const totalSalary = employees.reduce((sum, e) => sum + (parseFloat(e.salary.replace(/[^0-9.]/g, '')) || 0), 0);
  const avgSalary = totalEmployees ? totalSalary / totalEmployees : 0;

  // Données pour graphiques
  const payrollTrend = [
    { name: 'Jan', salaire: 4200 },
    { name: 'Fév', salaire: 4500 },
    { name: 'Mar', salaire: 4800 },
    { name: 'Avr', salaire: 5100 },
    { name: 'Mai', salaire: 5800 },
    { name: 'Juin', salaire: totalSalary || 6200 },
  ];

  const financeSplit = [
    { name: 'Revenus', value: finSummary.total_income },
    { name: 'Dépenses', value: finSummary.total_expense },
  ];

  const expenseByCategory = [
    { catégorie: 'Salaires', montant: totalSalary },
    { catégorie: 'Achats', montant: finSummary.total_expense * 0.4 },
    { catégorie: 'Logistique', montant: finSummary.total_expense * 0.25 },
    { catégorie: 'Autres', montant: finSummary.total_expense * 0.35 },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec salutation et date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {getGreeting()}, Admin
          </h2>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <Calendar size={16} />
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            Exporter
          </button>
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            Rapport
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Effectif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Effectif Total</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalEmployees}</h3>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-2">
                <ArrowUpRight size={14} /> +1 ce mois
              </span>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Masse salariale */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Masse Salariale</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {totalSalary.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </h3>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-2">
                Moy: {avgSalary.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $/agent
              </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        {/* Revenus totaux */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Revenus Totaux</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {finSummary.total_income.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </h3>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-2">
                <Activity size={14} /> Ce mois
              </span>
            </div>
            <div className="bg-violet-50 p-3 rounded-xl text-violet-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Solde net */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Solde Net</p>
              <h3 className={`text-3xl font-bold mt-2 ${finSummary.net_balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {finSummary.net_balance.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
              </h3>
              <span className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${finSummary.net_balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {finSummary.net_balance >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {finSummary.net_balance >= 0 ? 'Positif' : 'Négatif'}
              </span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique en aires */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900">Évolution Masse Salariale</h4>
            <span className="text-xs text-slate-400">6 derniers mois</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalaire" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="salaire" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalaire)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique en anneau */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h4 className="font-bold text-slate-900 mb-4">Répartition Financière</h4>
          <div className="flex-1 w-full" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {financeSplit.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-slate-500">Solde net</p>
            <p className={`text-xl font-bold ${finSummary.net_balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {finSummary.net_balance.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $
            </p>
          </div>
        </div>
      </div>

      {/* Section basse : dépenses par catégorie + activités récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Barres dépenses par catégorie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <h4 className="font-bold text-slate-900 mb-4">Dépenses par Catégorie</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="catégorie" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip />
                <Bar dataKey="montant" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dernières transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4">Activité Récente</h4>
          {loading ? (
            <p className="text-sm text-slate-400">Chargement...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune transaction récente</p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.description}</p>
                      <p className="text-xs text-slate-400">{t.category || '-'}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('fr-FR')} $
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}