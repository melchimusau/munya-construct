import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Calendar, Search } from 'lucide-react';

interface AttendanceRecordFE {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  employee_name?: string;
  employee_role?: string;
}

interface EmployeeFE {
  id: number;
  name: string;
  role: string;
  status: string;
  salary: string;
}

export default function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecordFE[]>([]);
  const [employees, setEmployees] = useState<EmployeeFE[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const emps = await apiService.getEmployees();
        setEmployees(emps.map(e => ({
          id: e.id,
          name: e.full_name,
          role: e.role,
          status: e.status,
          salary: `${e.base_salary} $`
        })));
      } catch (err) {
        console.error('Erreur chargement employés:', err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedDate) return;
      setLoading(true);
      try {
        const data = await apiService.getAttendance(selectedDate);
        // Enrichir avec le nom de l'employé
        const enriched = data.map((rec: any) => {
          const emp = employees.find(e => e.id === rec.employee_id);
          return {
            ...rec,
            employee_name: emp ? emp.name : 'Inconnu',
            employee_role: emp ? emp.role : '-',
          };
        });
        setRecords(enriched);
      } catch (err) {
        console.error('Erreur chargement pointages:', err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    if (employees.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, employees]);

  const filteredRecords = records.filter(rec => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      rec.employee_name?.toLowerCase().includes(term) ||
      rec.employee_role?.toLowerCase().includes(term) ||
      rec.date.includes(term)
    );
  });

  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const halfDayCount = filteredRecords.filter(r => r.status === 'half-day').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-slate-900">Historique des Présences</h3>
        <p className="text-sm text-slate-400 mt-1">Consultez les pointages passés</p>

        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, rôle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-center">
            <p className="text-xs text-emerald-600 font-medium">Présents</p>
            <p className="text-lg font-bold text-emerald-700">{presentCount}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <p className="text-xs text-red-600 font-medium">Absents</p>
            <p className="text-lg font-bold text-red-700">{absentCount}</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-center">
            <p className="text-xs text-amber-600 font-medium">Demi-journée</p>
            <p className="text-lg font-bold text-amber-700">{halfDayCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <p>Chargement des pointages...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>Aucun pointage pour cette date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="py-3 font-medium">Employé</th>
                  <th className="py-3 font-medium">Poste</th>
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium">Arrivée</th>
                  <th className="py-3 font-medium">Sortie</th>
                  <th className="py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-slate-800">{rec.employee_name}</td>
                    <td className="py-3 text-slate-600">{rec.employee_role}</td>
                    <td className="py-3">{rec.date}</td>
                    <td className="py-3">{rec.check_in || '-'}</td>
                    <td className="py-3">{rec.check_out || '-'}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                        rec.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                        rec.status === 'half-day' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {rec.status === 'present' ? 'Présent' :
                         rec.status === 'half-day' ? 'Demi-journée' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}