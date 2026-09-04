import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  id: number;
  username: string;
  role: string;
  full_name: string;
}

export default function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'rh' });

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
  if (!form.full_name || !form.email) return alert('Nom et email requis');
  try {
    const newUser = await apiService.createUser(form);
    alert(`✅ Utilisateur créé avec succès.\n\nEmail : ${newUser.email}\nMot de passe temporaire : ${newUser.temporary_password}`);
    setForm({ full_name: '', email: '', role: 'rh' });
    fetchUsers();
  } catch (err) {
    alert("Erreur lors de la création");
  }
};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4">Créer un utilisateur</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Nom complet" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="border rounded px-3 py-2" />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border rounded px-3 py-2" />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border rounded px-3 py-2">
            <option value="admin">Admin</option>
            <option value="rh">RH</option>
            <option value="pdg">PDG</option>
          </select>
        </div>
        <button onClick={handleCreate} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Créer</button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4">Liste des utilisateurs</h3>
        <table className="w-full text-left border-collapse">
          <thead><tr className="border-b"><th>Nom</th><th>Email</th><th>Rôle</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.full_name}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}