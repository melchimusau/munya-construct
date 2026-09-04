import { useState, useEffect } from 'react';
import { Eye, Printer } from 'lucide-react';
import { apiService, Invoice, Client } from '../services/api';
import InvoiceForm from './InvoiceForm';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async () => {
    try {
      const [invData, clientData] = await Promise.all([
        apiService.getInvoices(),
        apiService.getClients(),
      ]);
      // Convertir les montants en nombres
      const fixedInvoices = invData.map(inv => ({
        ...inv,
        total_ht: Number(inv.total_ht),
        total_ttc: Number(inv.total_ttc),
        tva_rate: Number(inv.tva_rate),
      }));
      setInvoices(fixedInvoices);
      setClients(clientData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleInvoiceCreated = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : '-';
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    SENT: 'bg-blue-50 text-blue-600',
    PAID: 'bg-emerald-50 text-emerald-600',
    CANCELLED: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Factures</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? 'Fermer' : 'Nouvelle facture'}
        </button>
      </div>

      {showForm && <InvoiceForm onInvoiceCreated={handleInvoiceCreated} />}

      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune facture enregistrée.</p>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-3 font-medium">N° Facture</th>
                <th className="py-3 font-medium">Client</th>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Total TTC</th>
                <th className="py-3 font-medium">Statut</th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium">{inv.invoice_number}</td>
                  <td className="py-3">{getClientName(inv.client_id)}</td>
                  <td className="py-3">{inv.issue_date}</td>
                  <td className="py-3">{inv.total_ttc.toFixed(2)} $</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button className="text-blue-600"><Eye size={16} /></button>
                    <button className="text-slate-400"><Printer size={16} /></button>
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