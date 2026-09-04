import { useState, useEffect } from 'react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchSettings = async () => {
    const res = await fetch('http://127.0.0.1:8000/settings', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    const data = await res.json();
    setSettings(data);
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveSetting = async (key: string) => {
    await fetch(`http://127.0.0.1:8000/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ value: editValue }),
    });
    setSettings(prev => ({ ...prev, [key]: editValue }));
    setEditKey(null);
  };

  const labels: Record<string, string> = {
    cnss_rate: 'Taux CNSS',
    inpp_rate: 'Taux INPP',
    working_days_per_month: 'Jours ouvrés/mois',
    company_name: 'Nom entreprise',
    company_address: 'Adresse',
    company_phone: 'Téléphone',
    company_email: 'Email',
    company_rccm: 'RCCM',
    company_idnat: 'ID.NAT',
    company_impot: 'N° IMPOT',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Paramètres système</h2>
      <div className="bg-white rounded-2xl shadow p-6">
        <table className="w-full text-left">
          <thead><tr><th>Paramètre</th><th>Valeur</th><th>Action</th></tr></thead>
          <tbody>
            {Object.entries(settings).map(([key, value]) => (
              <tr key={key}>
                <td className="py-2 font-medium">{labels[key] || key}</td>
                <td>
                  {editKey === key ? (
                    <input value={editValue} onChange={e => setEditValue(e.target.value)} className="border rounded px-2 py-1" />
                  ) : value}
                </td>
                <td>
                  {editKey === key ? (
                    <button onClick={() => saveSetting(key)} className="text-green-600">Enregistrer</button>
                  ) : (
                    <button onClick={() => { setEditKey(key); setEditValue(value); }} className="text-blue-600">Modifier</button>
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