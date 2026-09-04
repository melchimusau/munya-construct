import { useState, useEffect } from 'react';
import { apiService, Transaction } from '../services/api';

export default function FinanceView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    reference: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    reference: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('auth_user') || 'null');

  const fetchTransactions = async () => {
    try {
      const data = await apiService.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleAddTransaction = async () => {
    if (!form.description || !form.amount) return alert('Description et montant requis');
    setLoading(true);
    try {
      await apiService.createTransaction({
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type as 'income' | 'expense',
        category: form.category,
        reference: form.reference
      });
      setForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'expense', category: '', reference: '' });
      fetchTransactions();
      setMessage('✅ Écriture ajoutée');
    } catch (err) {
      setMessage('❌ Erreur');
    } finally { setLoading(false); }
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({
      date: t.date,
      description: t.description,
      amount: t.amount.toString(),
      type: t.type,
      category: t.category || '',
      reference: t.reference || ''
    });
  };

  const handleEditTransaction = async () => {
    if (!editForm.description || !editForm.amount) return alert('Description et montant requis');
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/transactions/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          date: editForm.date,
          description: editForm.description,
          amount: parseFloat(editForm.amount),
          type: editForm.type,
          category: editForm.category,
          reference: editForm.reference
        })
      });
      if (!res.ok) throw new Error('Erreur modification');
      setEditingId(null);
      fetchTransactions();
      setMessage('✅ Écriture modifiée');
    } catch (err) {
      setMessage('❌ Échec de modification');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <h3 className="text-xl font-bold mb-4">Nouvelle écriture comptable</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded px-3 py-2" />
          <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border rounded px-3 py-2" />
          <input type="number" placeholder="Montant" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="border rounded px-3 py-2" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border rounded px-3 py-2">
            <option value="income">Revenu</option>
            <option value="expense">Dépense</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <input placeholder="Catégorie" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border rounded px-3 py-2" />
          <input placeholder="Référence" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="border rounded px-3 py-2" />
        </div>
        <button onClick={handleAddTransaction} disabled={loading} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {message && <div className="mt-2 text-sm">{message}</div>}
      </div>

      {/* Formulaire d'édition (visible si editingId non nul) */}
      {editingId && (
        <div className="bg-amber-50 rounded-2xl border shadow-sm p-4 md:p-6">
          <h3 className="text-lg font-bold mb-4">Modifier l'écriture</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="border rounded px-3 py-2" />
            <input placeholder="Description" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="border rounded px-3 py-2" />
            <input type="number" placeholder="Montant" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="border rounded px-3 py-2" />
            <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className="border rounded px-3 py-2">
              <option value="income">Revenu</option>
              <option value="expense">Dépense</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <input placeholder="Catégorie" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="border rounded px-3 py-2" />
            <input placeholder="Référence" value={editForm.reference} onChange={e => setEditForm({...editForm, reference: e.target.value})} className="border rounded px-3 py-2" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleEditTransaction} disabled={loading} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Enregistrer</button>
            <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg">Annuler</button>
          </div>
        </div>
      )}

      {/* Liste des écritures */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">Historique des écritures</h3>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b text-sm text-slate-500">
              <th className="py-2">Date</th>
              <th className="py-2">Description</th>
              <th className="py-2">Catégorie</th>
              <th className="py-2">Type</th>
              <th className="py-2">Montant</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map(t => (
              <tr key={t.id} className="border-b hover:bg-slate-50">
                <td className="py-2">{t.date}</td>
                <td>{t.description}</td>
                <td>{t.category || '-'}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {t.type === 'income' ? 'Revenu' : 'Dépense'}
                  </span>
                </td>
                <td className="font-medium">{Number(t.amount).toFixed(2)} $</td>
                <td>
                  {currentUser && t.created_by === currentUser.id && !t.is_edited && (
                    <button onClick={() => startEdit(t)} className="text-blue-600 text-xs">Modifier</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}