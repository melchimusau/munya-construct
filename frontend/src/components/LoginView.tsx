import { useState } from 'react';
import { useAuth } from './AuthContext';
import logoMunya from '../assets/logo.png';

export default function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError('Nom d\'utilisateur ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <img src={logoMunya} alt="Munya Paie" className="w-24 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
          <p className="text-sm text-slate-500">Accédez à votre espace de gestion</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nom d'utilisateur</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Se connecter</button>
        </form>
      </div>
    </div>
  );
}