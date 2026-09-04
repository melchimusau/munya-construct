import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { apiService, Avance, Employee } from '../services/api';

export default function AvancesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [form, setForm] = useState({
    employee_id: 0,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [emps, avs] = await Promise.all([
        apiService.getEmployees(),
        apiService.getAvances(),
      ]);
      setEmployees(emps);
      setAvances(avs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!form.employee_id) return alert('Veuillez sélectionner un employé');
    if (!form.amount || parseFloat(form.amount) <= 0) return alert('Veuillez saisir un montant valide');

    setLoading(true);
    setMessage('');
    try {
      const newAvance = await apiService.createAvance({
        employee_id: form.employee_id,
        amount: parseFloat(form.amount),
        date: form.date,
        reason: form.reason,
      });
      setAvances(prev => [...prev, newAvance]);
      setForm({
        employee_id: 0,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        reason: '',
      });
      setMessage('✅ Avance ajoutée avec succès');
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout de l\'avance');
    } finally {
      setLoading(false);
    }
  };

  const employeeName = (id: number) => employees.find(e => e.id === id)?.full_name || 'Inconnu';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Gestion des avances</h3>

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
            type="number"
            placeholder="Montant"
            value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({...form, date: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Motif (optionnel)"
            value={form.reason}
            onChange={e => setForm({...form, reason: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <PlusCircle size={16} /> {loading ? 'Ajout...' : 'Ajouter l\'avance'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        <h4 className="text-lg font-semibold mb-4">Liste des avances</h4>
        {avances.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune avance enregistrée.</p>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-3 font-medium">Employé</th>
                <th className="py-3 font-medium">Montant</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Motif</th>
                <th className="py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {avances.map(av => (
                <tr key={av.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium">{employeeName(av.employee_id)}</td>
                  <td className="py-3">{av.amount} $</td>
                  <td className="py-3">{av.date}</td>
                  <td className="py-3">{av.reason || '-'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${av.deducted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {av.deducted ? 'Déduite' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}