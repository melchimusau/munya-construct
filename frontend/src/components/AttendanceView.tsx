import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface EmployeeFE {
  id: number;
  name: string;
  role: string;
  status: string;
  salary: string;
}

export default function AttendanceView({ employees, onRecordAttendance }: {
  employees: EmployeeFE[];
  onRecordAttendance: (empId: number, date: string, time: string, type: 'in' | 'out' | 'absent') => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [records, setRecords] = useState<Record<number, { date: string; checkIn: string; checkOut: string }>>({});

  useEffect(() => {
    const initial: Record<number, { date: string; checkIn: string; checkOut: string }> = {};
    employees.forEach(emp => {
      initial[emp.id] = { date: today, checkIn: '08:00', checkOut: '17:00' };
    });
    setRecords(initial);
  }, [employees, today]);

  const handleChange = (empId: number, field: string, value: string) => {
    if (field === 'date' && !value) return;
    setRecords(prev => ({ ...prev, [empId]: { ...prev[empId], [field]: value } }));
  };

  const handlePointIn = (empId: number) => {
    const rec = records[empId] || { date: today, checkIn: '08:00', checkOut: '17:00' };
    if (!rec.checkIn) return alert('Heure d’arrivée requise');
    if (!rec.date || rec.date.trim() === '') return alert('Veuillez sélectionner une date valide');
    onRecordAttendance(empId, rec.date, rec.checkIn, 'in');
    alert(`Pointage arrivée enregistré pour l'employé ${empId}`);
  };

  const handlePointOut = (empId: number) => {
    const rec = records[empId] || { date: today, checkIn: '08:00', checkOut: '17:00' };
    if (!rec.checkOut) return alert('Heure de sortie requise');
    if (!rec.date || rec.date.trim() === '') return alert('Veuillez sélectionner une date valide');
    onRecordAttendance(empId, rec.date, rec.checkOut, 'out');
    alert(`Pointage sortie enregistré pour l'employé ${empId}`);
  };

  const handlePointAbsent = (empId: number) => {
    const rec = records[empId] || { date: today, checkIn: '08:00', checkOut: '17:00' };
    if (!rec.date || rec.date.trim() === '') return alert('Veuillez sélectionner une date valide');
    onRecordAttendance(empId, rec.date, '', 'absent');
    alert(`Absence enregistrée pour l'employé ${empId}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Pointage de présence</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="py-3 font-medium">Employé</th><th className="py-3 font-medium">Poste</th><th className="py-3 font-medium">Date</th><th className="py-3 font-medium">Arrivée</th><th className="py-3 font-medium">Sortie</th><th className="py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {employees.map(emp => {
              const rec = records[emp.id] || { date: today, checkIn: '08:00', checkOut: '17:00' };
              return (
                <tr key={emp.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium">{emp.name}</td>
                  <td className="py-3 text-slate-600">{emp.role}</td>
                  <td className="py-3"><input type="date" value={rec.date} onChange={e => handleChange(emp.id, 'date', e.target.value)} className="border rounded px-2 py-1 text-sm w-full" /></td>
                  <td className="py-3"><input type="time" value={rec.checkIn} onChange={e => handleChange(emp.id, 'checkIn', e.target.value)} className="border rounded px-2 py-1 text-sm w-full" /></td>
                  <td className="py-3"><input type="time" value={rec.checkOut} onChange={e => handleChange(emp.id, 'checkOut', e.target.value)} className="border rounded px-2 py-1 text-sm w-full" /></td>
                  <td className="py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handlePointIn(emp.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Clock size={14} /> Arrivée</button>
                      <button onClick={() => handlePointOut(emp.id)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Clock size={14} /> Sortie</button>
                      <button onClick={() => handlePointAbsent(emp.id)} className="bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Clock size={14} /> Absent</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}