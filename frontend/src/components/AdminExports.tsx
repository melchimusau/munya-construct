export default function AdminExports() {
  const download = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = url.split('/').pop() + '.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Exports</h2>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => download('http://127.0.0.1:8000/export/employees')} className="bg-blue-600 text-white p-4 rounded-xl">
          Exporter Employés (CSV)
        </button>
      </div>
    </div>
  );
}