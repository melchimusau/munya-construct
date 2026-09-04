import { useState, useEffect } from 'react';

interface Contract {
  id: number;
  employee_id: number;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  salary: number;
  notes: string | null;
}

interface Props {
  employeeId: number;
}

export default function ContractManager({ employeeId }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [form, setForm] = useState({
    contract_type: 'CDI',
    start_date: '',
    end_date: '',
    trial_end_date: '',
    salary: '',
    notes: ''
  });

  const fetchContracts = async () => {
    try {
      const data = await fetch(`http://127.0.0.1:8000/employees/${employeeId}/contracts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      }).then(r => r.json());
      setContracts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [employeeId]);

  const handleAdd = async () => {
    if (!form.start_date || !form.salary) return alert('Date de début et salaire requis');
    try {
      await fetch('http://127.0.0.1:8000/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          contract_type: form.contract_type,
          start_date: form.start_date,
          end_date: form.end_date || null,
          trial_end_date: form.trial_end_date || null,
          salary: parseFloat(form.salary),
          notes: form.notes
        })
      });
      setForm({ contract_type: 'CDI', start_date: '', end_date: '', trial_end_date: '', salary: '', notes: '' });
      fetchContracts();
    } catch (err) {
      alert('Erreur lors de la création du contrat');
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/contracts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    fetchContracts();
  };

  return (
    <div className="mt-6 p-4 bg-white rounded-2xl border shadow-sm">
      <h3 className="text-lg font-bold mb-4">Contrats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <select value={form.contract_type} onChange={e => setForm({...form, contract_type: e.target.value})} className="border rounded px-2 py-1">
          <option>CDI</option><option>CDD</option><option>Freelance</option><option>Intérim</option><option>Stage</option>
        </select>
        <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="border rounded px-2 py-1" />
        <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="border rounded px-2 py-1" />
        <input type="date" value={form.trial_end_date} onChange={e => setForm({...form, trial_end_date: e.target.value})} className="border rounded px-2 py-1" />
        <input type="number" placeholder="Salaire" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className="border rounded px-2 py-1" />
        <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded px-2 py-1" />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded">Ajouter</button>
      </div>

      {contracts.length === 0 ? <p className="text-sm text-slate-400">Aucun contrat</p> : (
        <table className="w-full text-left">
          <thead><tr><th>Type</th><th>Début</th><th>Fin</th><th>Essai fin</th><th>Salaire</th><th></th></tr></thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id}>
                <td>{c.contract_type}</td>
                <td>{c.start_date}</td>
                <td>{c.end_date || '-'}</td>
                <td>{c.trial_end_date || '-'}</td>
                <td>{c.salary} $</td>
                <td><button onClick={() => handleDelete(c.id)} className="text-red-600">Suppr.</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}