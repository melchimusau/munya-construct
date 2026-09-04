import { useState, useEffect } from 'react';

interface LoginEntry {
  id: number;
  user_id: number;
  login_time: string;
  ip_address: string | null;
}

export default function AdminLoginHistory() {
  const [logs, setLogs] = useState<LoginEntry[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/login-history', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(r => r.json()).then(setLogs);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Journal des connexions</h2>
      <div className="bg-white rounded-2xl shadow p-6">
        <table className="w-full text-left">
          <thead><tr><th>ID</th><th>Utilisateur</th><th>Date/Heure</th><th>Adresse IP</th></tr></thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}><td className="py-2">{log.id}</td><td>{log.user_id}</td><td>{log.login_time}</td><td>{log.ip_address}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}