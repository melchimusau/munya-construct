import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Search } from 'lucide-react';
import { apiService, Prime, Employee } from '../services/api';

export default function PrimesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [primes, setPrimes] = useState<Prime[]>([]);
  const [form, setForm] = useState({
    employee_id: 0,
    description: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // format YYYY-MM
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [emps, prims] = await Promise.all([
        apiService.getEmployees(),
        apiService.getPrimes(),
      ]);
      setEmployees(emps);
      setPrimes(prims);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!form.employee_id) return alert('Veuillez sélectionner un employé');
    if (!form.description) return alert('Veuillez saisir une description');
    if (!form.amount || parseFloat(form.amount) <= 0) return alert('Veuillez saisir un montant valide');

    setLoading(true);
    setMessage('');
    try {
      const newPrime = await apiService.createPrime({
        employee_id: form.employee_id,
        description: form.description,
        amount: parseFloat(form.amount),
        month: form.month,
      });
      setPrimes(prev => [...prev, newPrime]);
      setForm({
        employee_id: 0,
        description: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
      });
      setMessage('✅ Prime ajoutée avec succès');
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout de la prime');
    } finally {
      setLoading(false);
    }
  };

  const employeeName = (id: number) => employees.find(e => e.id === id)?.full_name || 'Inconnu';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Gestion des primes</h3>

        {message && <div className="mb-4 text-sm font-medium">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select
            value={form.employee_id}
            onChange={e => setForm({...form, employee_id: parseInt(e.target.value)})}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value={0}>-- Choisir un employé --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
          <input
            placeholder="Description (ex: Prime de transport)"
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Montant"
            value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="month"
            value={form.month}
            onChange={e => setForm({...form, month: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <PlusCircle size={16} /> {loading ? 'Ajout...' : 'Ajouter la prime'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        <h4 className="text-lg font-semibold mb-4">Liste des primes</h4>
        {primes.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune prime enregistrée.</p>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-3 font-medium">Employé</th>
                <th className="py-3 font-medium">Description</th>
                <th className="py-3 font-medium">Mois</th>
                <th className="py-3 font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {primes.map(prime => (
                <tr key={prime.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium">{employeeName(prime.employee_id)}</td>
                  <td className="py-3">{prime.description}</td>
                  <td className="py-3">{prime.month}</td>
                  <td className="py-3 font-medium text-emerald-600">{prime.amount} $</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}