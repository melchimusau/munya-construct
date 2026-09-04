import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, X } from 'lucide-react';
import { apiService, Supplier, PurchaseOrder } from '../services/api';

interface POFormLine {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function PurchaseOrdersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier_id: 0,
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
  });
  const [lines, setLines] = useState<POFormLine[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [sup, po] = await Promise.all([apiService.getSuppliers(), apiService.getPurchaseOrders()]);
      setSuppliers(sup);
      setPurchaseOrders(po);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (index: number) => setLines(prev => prev.filter((_, i) => i !== index));
  const updateLine = (index: number, field: keyof POFormLine, value: string | number) =>
    setLines(prev => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);

  const handleSubmit = async () => {
    if (!form.supplier_id) return alert('Veuillez sélectionner un fournisseur');
    if (!form.order_date) return alert('Veuillez saisir une date de commande');
    if (lines.some(l => !l.description || l.quantity <= 0 || l.unit_price <= 0))
      return alert('Vérifiez les lignes de la commande');

    setLoading(true);
    setMessage('');
    try {
      await apiService.createPurchaseOrder({
        supplier_id: form.supplier_id,
        order_date: form.order_date,
        expected_date: form.expected_date || undefined,
        lines: lines.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      });
      setMessage('✅ Commande créée avec succès');
      setLines([{ description: '', quantity: 1, unit_price: 0 }]);
      setForm({ supplier_id: 0, order_date: new Date().toISOString().split('T')[0], expected_date: '' });
      fetchData();
      setShowForm(false);
    } catch (err) {
      setMessage('❌ Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-600',
    ORDERED: 'bg-blue-50 text-blue-600',
    RECEIVED: 'bg-emerald-50 text-emerald-600',
    CANCELLED: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Commandes d'achat</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          {showForm ? <X size={16} /> : <PlusCircle size={16} />}
          {showForm ? 'Fermer' : 'Nouvelle commande'}
        </button>
      </div>
      {message && <div className="text-sm font-medium">{message}</div>}
      {showForm && (
        <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
          <h3 className="text-lg font-bold mb-4">Créer une commande</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Fournisseur</label>
              <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: parseInt(e.target.value) })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                <option value={0}>-- Choisir un fournisseur --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Date de commande</label>
              <input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Date attendue</label>
              <input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="space-y-3 mb-6">
            {lines.map((line, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <input placeholder="Description" value={line.description} onChange={e => updateLine(index, 'description', e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Qté" value={line.quantity} onChange={e => updateLine(index, 'quantity', parseInt(e.target.value) || 0)} className="w-20 border rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Prix unit." value={line.unit_price} onChange={e => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-28 border rounded-lg px-3 py-2 text-sm" />
                <button onClick={() => removeLine(index)} disabled={lines.length === 1} className="text-red-600 disabled:opacity-40"><Trash2 size={18} /></button>
              </div>
            ))}
            <button onClick={addLine} className="flex items-center gap-1 text-blue-600 text-sm"><PlusCircle size={16} /> Ajouter une ligne</button>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{total.toFixed(2)} $</span>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
            <Save size={18} /> {loading ? 'Création...' : 'Créer la commande'}
          </button>
        </div>
      )}
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        <h4 className="text-lg font-semibold mb-4">Liste des commandes</h4>
        {purchaseOrders.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune commande enregistrée.</p>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-3 font-medium">N° Commande</th>
                <th className="py-3 font-medium">Fournisseur</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Total</th>
                <th className="py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {purchaseOrders.map(po => (
                <tr key={po.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium">{po.order_number}</td>
                  <td className="py-3">{suppliers.find(s => s.id === po.supplier_id)?.name || '-'}</td>
                  <td className="py-3">{po.order_date}</td>
                  <td className="py-3">{po.total ? po.total.toFixed(2) + ' $' : '-'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[po.status] || 'bg-slate-100 text-slate-600'}`}>{po.status}</span>
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