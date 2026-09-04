import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { apiService, Supplier } from '../services/api';

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setForm({ name: '', contact_person: '', email: '', phone: '', address: '' });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name) return alert('Le nom du fournisseur est obligatoire');
    setLoading(true);
    setMessage('');
    try {
      if (editingId) {
        // Pas de endpoint update pour l'instant
        alert('Modification non implémentée côté backend');
      } else {
        const newSupplier = await apiService.createSupplier(form);
        setSuppliers(prev => [...prev, newSupplier]);
        setMessage('✅ Fournisseur ajouté avec succès');
      }
      resetForm();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'enregistrement du fournisseur');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Gestion des fournisseurs</h3>

        {message && <div className="mb-4 text-sm font-medium">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            placeholder="Nom du fournisseur *"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Personne de contact"
            value={form.contact_person}
            onChange={e => setForm({...form, contact_person: e.target.value})}
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
        <h4 className="text-lg font-semibold mb-4">Liste des fournisseurs</h4>
        {suppliers.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun fournisseur enregistré.</p>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-3 font-medium">Nom</th>
                <th className="py-3 font-medium">Contact</th>
                <th className="py-3 font-medium">Email</th>
                <th className="py-3 font-medium">Téléphone</th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {suppliers.map(supplier => (
                <tr key={supplier.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium">{supplier.name}</td>
                  <td className="py-3">{supplier.contact_person || '-'}</td>
                  <td className="py-3">{supplier.email || '-'}</td>
                  <td className="py-3">{supplier.phone || '-'}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => handleEdit(supplier)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
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