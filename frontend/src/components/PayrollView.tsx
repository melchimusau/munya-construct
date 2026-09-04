import { useState } from 'react';
import { Printer } from 'lucide-react';
import { apiService, PayrollEmployee } from '../services/api';
import logoMunya from '../assets/logo.png';

export default function PayrollView() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payrollData, setPayrollData] = useState<PayrollEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!startDate || !endDate) return alert('Sélectionnez une période');
    setLoading(true);
    try {
      const data = await apiService.calculatePayroll(startDate, endDate);
      setPayrollData(data);
    } catch (err) {
      alert('Erreur calcul');
    } finally {
      setLoading(false);
    }
  };

  const totalNet = payrollData.reduce((sum, e) => sum + e.net_salary, 0);

  const printPayslip = (employee: PayrollEmployee) => {
    const today = new Date().toLocaleDateString('fr-FR');
    const payslipHTML = `
      <html>
        <head><title>Bulletin de paie - ${employee.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .company { text-align: left; }
            .company img { width: 80px; height: auto; margin-bottom: 8px; }
            .employee { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .total { margin-top: 20px; text-align: right; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">
              <img src="${logoMunya}" alt="Munya Paie" />
              <h2>MUNYA CONSTRUCT</h2>
              <p>Av. Judex Lupepe, Kolwezi RDC</p>
              <p>Tél: +243 903 295 707</p>
              <p>Email: info@munya-construct.cpm</p>
            </div>
            <div class="employee">
              <h3>Bulletin de paie</h3>
              <p><strong>${employee.full_name}</strong></p>
              <p>Période : du ${startDate} au ${endDate}</p>
              <p>Date d'émission : ${today}</p>
            </div>
          </div>
          <table>
            <tr><th>Description</th><th>Montant ($)</th></tr>
            <tr><td>Salaire de base (${employee.base_salary.toFixed(2)} $ / 26 jours)</td><td>${employee.gross_salary.toFixed(2)}</td></tr>
            <tr><td>Jours travaillés</td><td>${employee.days_worked}</td></tr>
            <tr><td>Heures normales</td><td>${employee.regular_hours}</td></tr>
            <tr><td>Heures supplémentaires</td><td>${employee.overtime_hours}</td></tr>
            <tr><td><strong>Salaire brut</strong></td><td><strong>${employee.gross_salary.toFixed(2)}</strong></td></tr>
            <tr><td>CNSS (5%)</td><td>- ${employee.cnss.toFixed(2)}</td></tr>
            <tr><td>INPP (2%)</td><td>- ${employee.inpp.toFixed(2)}</td></tr>
            <tr><td>IPR</td><td>- ${employee.ipr.toFixed(2)}</td></tr>
            <tr><td><strong>Net à payer</strong></td><td><strong>${employee.net_salary.toFixed(2)} $</strong></td></tr>
          </table>
          <div class="total">
            <p>Date de paiement : _______________</p>
            <p>Signature de l'employé : _______________</p>
          </div>
          <div class="footer">
            <p>Munya Construct - RCCM: CD/KNG/RCCM/20-A-01528 - ID.NAT: 01-04701-N05692A</p>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      win.document.write(payslipHTML);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-slate-900">Calcul de Paie & Bulletins</h3>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div><label>Début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div><label>Fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2" /></div>
          <div className="flex items-end"><button onClick={handleCalculate} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded w-full">{loading ? 'Calcul...' : 'Calculer'}</button></div>
        </div>
      </div>
      {payrollData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="py-3 font-medium">Employé</th><th className="py-3 font-medium">Salaire base</th><th className="py-3 font-medium">Jours</th><th className="py-3 font-medium">Heures norm.</th><th className="py-3 font-medium">Heures supp.</th><th className="py-3 font-medium">Brut</th><th className="py-3 font-medium">CNSS</th><th className="py-3 font-medium">INPP</th><th className="py-3 font-medium">IPR</th><th className="py-3 font-medium">Net</th><th className="py-3 font-medium text-center">Bulletin</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map(e => (
                <tr key={e.employee_id} className="border-b border-slate-100">
                  <td className="py-3 font-medium">{e.full_name}</td>
                  <td>{e.base_salary.toFixed(2)} $</td>
                  <td>{e.days_worked}</td>
                  <td>{e.regular_hours}</td>
                  <td>{e.overtime_hours}</td>
                  <td>{e.gross_salary.toFixed(2)} $</td>
                  <td>{e.cnss.toFixed(2)} $</td>
                  <td>{e.inpp.toFixed(2)} $</td>
                  <td>{e.ipr.toFixed(2)} $</td>
                  <td className="font-semibold text-emerald-600">{e.net_salary.toFixed(2)} $</td>
                  <td className="text-center">
                    <button onClick={() => printPayslip(e)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1 mx-auto">
                      <Printer size={14} /> Bulletin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td colSpan={10} className="text-right py-3">Total Net :</td>
                <td className="text-emerald-600 py-3">{totalNet.toFixed(2)} $</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}