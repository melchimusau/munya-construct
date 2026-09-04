import { useState, useEffect } from 'react';
import { Upload, Download, Trash2 } from 'lucide-react';

interface DocumentItem {
  id: number;
  filename: string;
  content_type: string;
  size: number;
  upload_date: string;
}

export default function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/documents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return alert('Veuillez choisir un fichier');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://127.0.0.1:8000/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Erreur upload');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      alert("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    await fetch(`http://127.0.0.1:8000/documents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    fetchDocuments();
  };

  const handleDownload = async (doc: DocumentItem) => {
  try {
    const res = await fetch(`http://127.0.0.1:8000/documents/${doc.id}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.detail || 'Erreur de téléchargement');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    alert(err.message || 'Erreur lors du téléchargement');
  }
};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <h2 className="text-xl font-bold mb-4">Gestion des documents</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="border rounded px-3 py-2 w-full sm:w-auto"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Upload size={18} /> {uploading ? 'Envoi...' : 'Téléverser'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">Documents stockés</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun document</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b"><th>Nom</th><th>Type</th><th>Taille</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-b">
                  <td className="py-2">{doc.filename}</td>
                  <td>{doc.content_type}</td>
                  <td>{(doc.size / 1024).toFixed(1)} Ko</td>
                  <td>{new Date(doc.upload_date).toLocaleString()}</td>
                  <td className="space-x-2">
                    <button onClick={() => handleDownload(doc)} className="text-blue-600"><Download size={16} /></button>
                    <button onClick={() => handleDelete(doc.id)} className="text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}