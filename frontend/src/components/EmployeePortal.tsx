import { useState, useEffect } from 'react';
import { UserCircle, CalendarCheck, FileText, DollarSign, Briefcase } from 'lucide-react';
import { apiService } from '../services/api';
import type { Employee, AttendanceRecord } from '../services/api';

export default function EmployeePortal() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiService.getMyInfo(),
      apiService.getMyAttendance(),
      apiService.getMyContracts(),
      apiService.getMyPayslips(),
    ])
      .then(([emp, att, con, pay]) => {
        setEmployee(emp);
        setAttendance(att);
        setContracts(con);
        setPayslips(pay);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement de votre espace...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600">
            <UserCircle size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{employee?.full_name}</h2>
            <p className="text-slate-500">{employee?.role}</p>
            <p className="text-sm text-slate-400">{employee?.email || 'Email non défini'}</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
              {employee?.status}
            </span>
          </div>
        </div>

        {/* Grille des sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pointages récents */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
              <CalendarCheck size={20} /> Mes pointages récents
            </h3>
            {attendance.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun pointage enregistré.</p>
            ) : (
              <ul className="space-y-2">
                {attendance.slice(-5).reverse().map(a => (
                  <li key={a.id} className="flex justify-between text-sm py-2 border-b border-slate-100">
                    <span>{a.date}</span>
                    <span>{a.check_in || '-'} → {a.check_out || '-'}</span>
                    <span className={a.status === 'present' ? 'text-emerald-600' : 'text-red-500'}>
                      {a.status === 'present' ? 'Présent' : 'Absent'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contrats */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
              <Briefcase size={20} /> Mes contrats
            </h3>
            {contracts.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun contrat trouvé.</p>
            ) : (
              <ul className="space-y-2">
                {contracts.map(c => (
                  <li key={c.id} className="text-sm py-2 border-b border-slate-100">
                    <p className="font-medium">{c.contract_type} — Salaire: {c.salary} $</p>
                    <p className="text-xs text-slate-400">
                      Du {c.start_date} {c.end_date ? `au ${c.end_date}` : ' (CDI)'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bulletins de paie */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
              <FileText size={20} /> Mes bulletins
            </h3>
            {payslips.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun bulletin disponible.</p>
            ) : (
              <ul className="space-y-2">
                {payslips.map(p => (
                  <li key={p.id} className="flex justify-between text-sm py-2 border-b border-slate-100">
                    <span>{p.month}</span>
                    <span className="text-emerald-600">{p.net_salary} $</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Solde congés (placeholder) */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
              <DollarSign size={20} /> Solde de congés
            </h3>
            <p className="text-sm text-slate-400">Fonctionnalité à venir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}