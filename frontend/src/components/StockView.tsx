import { useState } from 'react';
import { PlusCircle, ShoppingCart, Printer } from 'lucide-react';
import logoMunya from '../assets/logo.png';

interface StockItemFE {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

interface StockMovementFE {
  id: number;
  date: string;
  type: 'entrée' | 'sortie';
  itemId: number;
  quantity: number;
  reason?: string;
}

export default function StockView({ stockItems, movements, onAddItem, onUpdateQuantity, onRecordSale }: {
  stockItems: StockItemFE[];
  movements: StockMovementFE[];
  onAddItem: (item: Omit<StockItemFE, 'id'>) => void;
  onUpdateQuantity: (itemId: number, delta: number, reason: string) => void;
  onRecordSale: (itemId: number, quantity: number, clientName: string) => void;
}) {
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unitPrice: 0, description: '' });
  const [saleItemId, setSaleItemId] = useState<number | null>(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [clientName, setClientName] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);

  const safeStockItems = Array.isArray(stockItems) ? stockItems : [];
  const safeMovements = Array.isArray(movements) ? movements : [];

  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0 || newItem.unitPrice <= 0) return alert('Champs requis');
    onAddItem(newItem);
    setNewItem({ name: '', quantity: 0, unitPrice: 0, description: '' });
  };

  const openSaleModal = (itemId: number) => { setSaleItemId(itemId); setSaleQuantity(1); setClientName(''); setShowSaleModal(true); };
  const executeSale = () => {
    if (saleItemId === null || saleQuantity <= 0 || !clientName.trim()) return alert('Client et quantité requis');
    onRecordSale(saleItemId, saleQuantity, clientName.trim());
    setShowSaleModal(false);
  };

  const printInvoice = () => {
    const item = safeStockItems.find(i => i.id === saleItemId);
    if (!item || saleQuantity <= 0 || !clientName.trim()) return alert('Remplissez les champs');
    const price = Number(item.unitPrice) || 0;   // sécurisé
    const totalHT = saleQuantity * price;
    const tva = totalHT * 0.16;
    const totalTTC = totalHT + tva;
    const today = new Date().toLocaleDateString('fr-FR');
    const invoiceNumber = 'FAC-' + Date.now().toString().slice(-6);
    const invoiceHTML = `
      <html>
        <head><meta charset="UTF-8"><title>Facture ${invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo img { width: 80px; height: auto; }
            .company-info h2 { color: #1e3a8a; font-size: 24px; margin-bottom: 5px; }
            .company-info p { font-size: 14px; color: #475569; line-height: 1.5; }
            .client-info h3 { color: #1e3a8a; font-size: 20px; margin-bottom: 8px; }
            .client-info p { font-size: 14px; color: #475569; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            th { background: #2563eb; color: #fff; padding: 12px; text-align: left; font-weight: 600; }
            td { padding: 12px; background: #fff; border-bottom: 1px solid #e2e8f0; }
            tr:last-child td { border-bottom: none; }
            .totals { text-align: right; margin-top: 20px; }
            .totals .net { font-size: 18px; font-weight: 700; color: #2563eb; margin-top: 10px; border-top: 2px solid #2563eb; padding-top: 10px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="logo"><img src="${logoMunya}" alt="Logo Munya Paie" /></div>
              <div class="company-info">
                <h2>MUNYA CONSTRUCT</h2>
                <p>Av. Judex Lupepe, coin marché Muyej, Kolwezi RDC</p>
                <p>Tél: +243 903 295 707 | +243 992 965 897</p>
                <p>Email: info@munya-construct.cpm</p>
              </div>
            </div>
            <div class="client-info" style="text-align:right; margin-bottom:20px;">
              <h3>FACTURE</h3>
              <p><span>N° :</span> ${invoiceNumber}</p>
              <p><span>Date :</span> ${today}</p>
              <p><span>Client :</span> ${clientName}</p>
            </div>
            <table>
              <thead><tr><th>Qté</th><th>Description</th><th>Prix unitaire</th><th>Total</th></tr></thead>
              <tbody><tr><td>${saleQuantity}</td><td>${item.name}</td><td>${price.toFixed(2)} $</td><td>${totalHT.toFixed(2)} $</td></tr></tbody>
            </table>
            <div class="totals">
              <p>Sous-total : ${totalHT.toFixed(2)} $</p>
              <p>TVA (16%) : ${tva.toFixed(2)} $</p>
              <p class="net">Total TTC : ${totalTTC.toFixed(2)} $</p>
            </div>
            <div class="footer">
              <p>Munya Construct - RCCM: CD/KNG/RCCM/20-A-01528 | ID.NAT: 01-04701-N05692A | N° IMPOT: A2171268P</p>
              <p>Merci de votre confiance !</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(invoiceHTML); win.document.close(); win.print(); }
  };

  const printExitNote = (movement: StockMovementFE) => {
    const item = safeStockItems.find(i => i.id === movement.itemId);
    if (!item) return;
    const exitNumber = 'BS-' + Date.now().toString().slice(-6);
    const exitHTML = `
      <html>
        <head><meta charset="UTF-8"><title>Bon de sortie ${exitNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo img { width: 80px; height: auto; }
            .company-info h2 { color: #1e3a8a; font-size: 24px; margin-bottom: 5px; }
            .company-info p { font-size: 14px; color: #475569; line-height: 1.5; }
            .exit-title { text-align: center; margin: 25px 0; }
            .exit-title h1 { font-size: 28px; color: #1e3a8a; letter-spacing: 1px; text-transform: uppercase; }
            .details { margin-bottom: 25px; font-size: 14px; }
            .details p { margin-bottom: 8px; }
            .details span { font-weight: 600; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            th { background: #2563eb; color: #fff; padding: 12px; text-align: left; font-weight: 600; }
            td { padding: 12px; background: #fff; border-bottom: 1px solid #e2e8f0; }
            tr:last-child td { border-bottom: none; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo"><img src="${logoMunya}" alt="Logo Munya Paie" /></div>
              <div class="company-info">
                <h2>MUNYA CONSTRUCT</h2>
                <p>Av. Judex Lupepe, coin marché Muyej, Kolwezi RDC</p>
                <p>Tél: +243 903 295 707 | +243 992 965 897</p>
              </div>
            </div>
            <div class="exit-title">
              <h1>Bon de sortie</h1>
              <p>N° ${exitNumber} du ${movement.date}</p>
            </div>
            <div class="details">
              <p><span>Motif :</span> ${movement.reason || '-'}</p>
              <p><span>Date de mouvement :</span> ${movement.date}</p>
            </div>
            <table>
              <thead><tr><th>Article</th><th>Quantité</th></tr></thead>
              <tbody><tr><td>${item.name}</td><td>${movement.quantity}</td></tr></tbody>
            </table>
            <div class="signature">
              <div><p>Signature du responsable : _________________</p></div>
              <div><p>Signature du bénéficiaire : _________________</p></div>
            </div>
            <div class="footer">
              <p>Munya Construct - RCCM: CD/KNG/RCCM/20-A-01528 | ID.NAT: 01-04701-N05692A</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(exitHTML); win.document.close(); win.print(); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Ajouter un matériau</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Nom du matériau" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Quantité initiale" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Prix unitaire ($)" value={newItem.unitPrice || ''} onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><PlusCircle size={18} /> Ajouter</button>
        </div>
        <input type="text" placeholder="Description (optionnelle)" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="mt-3 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">État des stocks</h3>
        {safeStockItems.length === 0 ? <p className="text-sm text-slate-400">Aucun matériau en stock.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-slate-200 text-sm text-slate-500"><th className="py-3 font-medium">Matériau</th><th className="py-3 font-medium">Quantité</th><th className="py-3 font-medium">Prix unitaire</th><th className="py-3 font-medium">Valeur totale</th><th className="py-3 font-medium text-right">Actions</th></tr></thead>
              <tbody className="text-sm">
                {safeStockItems.map(item => {
                  const price = Number(item.unitPrice) || 0;  // sécurisé
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-800">{item.name}</td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">{price.toFixed(2)} $</td>
                      <td className="py-3">{(item.quantity * price).toFixed(2)} $</td>
                      <td className="py-3 text-right space-x-2">
                        <button onClick={() => onUpdateQuantity(item.id, 1, 'Entrée manuelle')} className="text-emerald-600 hover:text-emerald-800 text-xs font-medium">+ Entrée</button>
                        <button onClick={() => onUpdateQuantity(item.id, -1, 'Sortie manuelle')} className="text-amber-600 hover:text-amber-800 text-xs font-medium">- Sortie</button>
                        <button onClick={() => openSaleModal(item.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium"><ShoppingCart size={14} className="inline mr-1" /> Vendre</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Derniers mouvements</h3>
        {safeMovements.length === 0 ? <p className="text-sm text-slate-400">Aucun mouvement enregistré.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-slate-200 text-sm text-slate-500"><th>Date</th><th>Article</th><th>Type</th><th>Quantité</th><th>Motif</th><th className="text-center">Actions</th></tr></thead>
              <tbody className="text-sm">
                {safeMovements.slice(-10).reverse().map(mov => {
                  const item = safeStockItems.find(i => i.id === mov.itemId);
                  return (
                    <tr key={mov.id} className="border-b border-slate-100">
                      <td className="py-2">{mov.date}</td>
                      <td className="py-2 font-medium">{item?.name || 'Article supprimé'}</td>
                      <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${mov.type === 'entrée' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{mov.type}</span></td>
                      <td className="py-2">{mov.quantity}</td>
                      <td className="py-2 text-slate-500">{mov.reason || '-'}</td>
                      <td className="py-2 text-center">
                        {mov.type === 'sortie' && (
                          <button onClick={() => printExitNote(mov)} className="text-blue-600 hover:text-blue-800 text-xs font-medium"><Printer size={14} className="inline mr-1" /> Bon sortie</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Nouvelle vente</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nom du client" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Quantité vendue" value={saleQuantity} min={1} onChange={e => setSaleQuantity(parseInt(e.target.value) || 1)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setShowSaleModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button onClick={executeSale} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><ShoppingCart size={16} /> Vendre</button>
                <button onClick={printInvoice} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"><Printer size={16} /> Facture PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}