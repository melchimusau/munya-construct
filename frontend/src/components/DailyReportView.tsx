import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

interface DailyReport {
  date: string;
  content: string;
}

export default function DailyReportView({ reports, onSaveReport }: { reports: DailyReport[]; onSaveReport: (date: string, content: string) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [content, setContent] = useState('');

  useEffect(() => {
    const existing = reports.find(r => r.date === selectedDate);
    setContent(existing ? existing.content : '');
  }, [selectedDate, reports]);

  const handleSave = () => {
    if (!selectedDate || !content.trim()) return alert('Veuillez remplir tous les champs');
    onSaveReport(selectedDate, content.trim());
    alert('Rapport enregistré !');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Rapport Journalier</h3>
        <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2"><Save size={18} /> Enregistrer</button>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">Date :</label>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border px-3 py-2 rounded-lg" />
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Saisissez le rapport d'activités du jour..." className="w-full h-64 p-4 border rounded-xl" />
      <div className="mt-6">
        <h4 className="font-semibold">Rapports précédents</h4>
        {reports.length === 0 ? <p className="text-sm text-slate-400">Aucun rapport</p> : reports.map(r => (<div key={r.date} className="p-2 bg-slate-50 rounded my-1">{r.date} - {r.content.substring(0, 60)}</div>))}
      </div>
    </div>
  );
}