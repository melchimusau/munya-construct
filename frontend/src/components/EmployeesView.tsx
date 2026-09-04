import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import ContractManager from './ContractManager';

interface EmployeeFE {
  id: number;
  name: string;
  role: string;
  status: 'Actif' | 'Essai' | 'Inactif';
  salary: string;
}

type EmployeesViewProps = {
  employees: EmployeeFE[];
  onAdd: (emp: Omit<EmployeeFE, 'id'>) => void;
  onUpdate: (id: number, emp: Partial<EmployeeFE>) => void;
  onDelete: (id: number) => void;
};

export default function EmployeesView({ employees, onAdd, onUpdate, onDelete }: EmployeesViewProps) {
  const [form, setForm] = useState<{ name: string; role: string; status: 'Actif' | 'Essai' | 'Inactif'; salary: string }>({ name: '', role: '', status: 'Actif', salary: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const handleSave = () => {
    if (!form.name || !form.role || !form.salary) return alert('Tous les champs sont obligatoires');
    if (editingId) {
      onUpdate(editingId, form);
      setEditingId(null);
    } else {
      onAdd(form);
    }
    setForm({ name: '', role: '', status: 'Actif', salary: '' });
  };

  const startEdit = (emp: EmployeeFE) => {
    setEditingId(emp.id);
    setForm({ name: emp.name, role: emp.role, status: emp.status, salary: emp.salary });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Liste des Employés</h3>
          <p className="text-sm text-slate-400">Gérez les informations du personnel</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm({ name: '', role: '', status: 'Actif', salary: '' }); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <UserPlus size={16} /> Nouvel Employé
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <input placeholder="Nom complet" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Poste / Rôle" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'Actif' | 'Essai' | 'Inactif'})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="Actif">Actif</option>
          <option value="Essai">Essai</option>
          <option value="Inactif">Inactif</option>
        </select>
        <input placeholder="Salaire" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-3 mb-6">
        <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {editingId ? 'Modifier' : 'Ajouter'}
        </button>
        {editingId && (
          <button onClick={() => setEditingId(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm">
            Annuler
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="py-4 font-medium">Nom complet</th>
              <th className="py-4 font-medium">Poste / Rôle</th>
              <th className="py-4 font-medium">Salaire de Base</th>
              <th className="py-4 font-medium">Statut</th>
              <th className="py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {employees.map(emp => (
              <tr
                key={emp.id}
                className={`border-b hover:bg-slate-50 transition-colors cursor-pointer ${selectedEmployeeId === emp.id ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedEmployeeId(selectedEmployeeId === emp.id ? null : emp.id)}
              >
                <td className="py-4 font-medium text-slate-800">{emp.name}</td>
                <td className="py-4 text-slate-600">{emp.role}</td>
                <td className="py-4 text-slate-600 font-medium">{emp.salary}</td>
                <td className="py-4">
                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${emp.status === 'Actif' ? 'bg-emerald-50 text-emerald-600' : emp.status === 'Essai' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="py-4 text-right space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(emp); }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(emp.id); }}
                    className="text-red-600 hover:text-red-800 font-medium text-xs"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gestion des contrats pour l'employé sélectionné */}
      {selectedEmployeeId && (
        <ContractManager employeeId={selectedEmployeeId} />
      )}
    </div>
  );
}