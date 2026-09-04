import { useState } from 'react';
import { apiService } from '../services/api';  // plus d'import setAuthToken
import logoMunya from '../assets/logo.png';

interface Props {
  onPasswordChanged: () => void;
}

export default function ResetPasswordView({ onPasswordChanged }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await apiService.changePassword(oldPassword, newPassword);
      setSuccess('Mot de passe modifié avec succès. Redirection...');
      setTimeout(() => {
        onPasswordChanged();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <img src={logoMunya} alt="Logo" className="w-24 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Changement de mot de passe</h2>
          <p className="text-sm text-slate-500 mt-2">Pour des raisons de sécurité, vous devez définir un nouveau mot de passe.</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Mot de passe actuel</label>
            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Enregistrer le nouveau mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}