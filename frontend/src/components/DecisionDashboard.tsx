import { useState, useEffect } from 'react';
import { TrendingUp, Package, PieChart } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Pie, Cell, Legend
} from 'recharts';
import { apiService } from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DecisionDashboard() {
  const [salesMonthly, setSalesMonthly] = useState<{ month: string; total: number }[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<{ category: string; total: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiService.getSalesMonthly(),
      apiService.getExpensesByCategory(),
      apiService.getTopProducts(),
    ])
      .then(([sales, expenses, products]) => {
        setSalesMonthly(sales);
        setExpensesByCategory(expenses);
        setTopProducts(products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement de l'analyse...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Tableau de bord décisionnel</h2>

      {/* Ventes mensuelles */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" /> Ventes mensuelles
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVentes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dépenses par catégorie */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-emerald-600" /> Dépenses par catégorie
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Package size={20} className="text-violet-600" /> Top 5 produits vendus
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}