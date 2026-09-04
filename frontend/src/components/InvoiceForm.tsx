import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { apiService, Client } from '../services/api';

interface InvoiceFormLine {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function InvoiceForm({ onInvoiceCreated }: { onInvoiceCreated?: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<number>(0);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<InvoiceFormLine[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiService.getClients().then(setClients).catch(console.error);
  }, []);

  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
  const removeLine = (index: number) => setLines(prev => prev.filter((_, i) => i !== index));
  const updateLine = (index: number, field: keyof InvoiceFormLine, value: string | number) =>
    setLines(prev => prev.map((line, i) => i === index ? { ...line, [field]: value } : line));

  const totalHT = lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
  const tvaRate = 16;
  const totalTTC = totalHT * (1 + tvaRate / 100);

  const handleSubmit = async () => {
    if (!selectedClient) return alert('Veuillez sélectionner un client');
    if (!issueDate) return alert('Veuillez saisir une date de facture');
    if (lines.some(l => !l.description || l.quantity <= 0 || l.unit_price <= 0))
      return alert('Vérifiez les lignes de la facture');

    setLoading(true);
    setMessage('');
    try {
      await apiService.createInvoice({
        client_id: selectedClient,
        issue_date: issueDate,
        due_date: dueDate || null,
        notes,
        lines: lines.map(l => ({ description: l.description, quantity: l.quantity, unit_price: l.unit_price }))
      });
      setMessage('✅ Facture créée avec succès');
      // Réinitialiser le formulaire
      setLines([{ description: '', quantity: 1, unit_price: 0 }]);
      setNotes('');
      setDueDate('');
      // Notifier le parent pour rafraîchir la liste
      if (onInvoiceCreated) onInvoiceCreated();
    } catch (err) {
      setMessage('❌ Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-6">Créer une facture</h3>
      {message && <div className="mb-4 text-sm font-medium">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(parseInt(e.target.value))} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
            <option value={0}>-- Choisir un client --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Date de facture</label>
          <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Date d'échéance</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
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
        <div className="flex justify-between text-sm mb-1"><span>Total HT</span><span>{totalHT.toFixed(2)} $</span></div>
        <div className="flex justify-between text-sm mb-1"><span>TVA ({tvaRate}%)</span><span>{(totalHT * tvaRate / 100).toFixed(2)} $</span></div>
        <div className="flex justify-between font-bold text-lg"><span>Total TTC</span><span>{totalTTC.toFixed(2)} $</span></div>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
        <Save size={18} /> {loading ? 'Création...' : 'Créer la facture'}
      </button>
    </div>
  );
}