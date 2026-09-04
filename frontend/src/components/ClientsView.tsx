import { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { apiService, Client } from '../services/api';

export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchClients = async () => {
    try {
      const data = await apiService.getClients();
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', address: '' });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name) return alert('Le nom du client est obligatoire');
    setLoading(true);
    setMessage('');
    try {
      if (editingId) {
        // Pour l'instant, pas de endpoint update ; on gérera plus tard
        alert('Modification non implémentée côté backend');
      } else {
        const newClient = await apiService.createClient(form);
        setClients(prev => [...prev, newClient]);
        setMessage('✅ Client ajouté avec succès');
      }
      resetForm();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'enregistrement du client');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Gestion des clients</h3>

        {message && <div className="mb-4 text-sm font-medium">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            placeholder="Nom du client *"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Téléphone"
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Adresse"
            value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <UserPlus size={16} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm">
              Annuler
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        <h4 className="text-lg font-semibold mb-4">Liste des clients</h4>
        {clients.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun client enregistré.</p>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-3 font-medium">Nom</th>
                <th className="py-3 font-medium">Email</th>
                <th className="py-3 font-medium">Téléphone</th>
                <th className="py-3 font-medium">Adresse</th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {clients.map(client => (
                <tr key={client.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium">{client.name}</td>
                  <td className="py-3">{client.email || '-'}</td>
                  <td className="py-3">{client.phone || '-'}</td>
                  <td className="py-3">{client.address || '-'}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                      Modifier
                    </button>
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