import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoMunya from '../assets/logo.png';
import type { Invoice, Client } from '../services/api';

export const generateInvoicePDF = (invoice: Invoice, client?: Client) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  const rBlue = 30, gBlue = 64, bBlue = 175;
  const rGrey = 75, gGrey = 85, bGrey = 99;
  const rDarkBlue = 23, gDarkBlue = 37, bDarkBlue = 84;

  // --- EN-TÊTE ENTREPRISE ---
  doc.setFontSize(20);
  doc.setTextColor(rBlue, gBlue, bBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('MUNYA CONSTRUCT', margin, y);

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Av. Judex Lupepe, coin marché Muyej, Kolwezi RDC', margin, y);
  y += 5;
  doc.text('Tél: +243 903 295 707 | +243 992 965 897', margin, y);
  y += 5;
  doc.text('Email: info@munya-construct.cpm', margin, y);

  // --- EN-TÊTE CLIENT ---
  const rightX = pageWidth - margin;
  let yRight = 20;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', rightX - 60, yRight);
  doc.setFont('helvetica', 'normal');
  yRight += 6;
  doc.text(client?.name || 'Client', rightX - 60, yRight);
  if (client?.email) { yRight += 6; doc.text(client.email, rightX - 60, yRight); }
  if (client?.phone) { yRight += 6; doc.text(client.phone, rightX - 60, yRight); }
  if (client?.address) { yRight += 6; doc.text(client.address, rightX - 60, yRight); }

  // --- NUMÉRO FACTURE ---
  y = Math.max(y, yRight) + 10;
  doc.setFontSize(14);
  doc.setTextColor(rBlue, gBlue, bBlue);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURE N° ${invoice.invoice_number}`, margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date d'émission : ${invoice.issue_date}`, margin, y);
  if (invoice.due_date) {
    y += 5;
    doc.text(`Date d'échéance : ${invoice.due_date}`, margin, y);
  }

  // --- LIGNE BLEUE ---
  y += 6;
  doc.setDrawColor(rBlue, gBlue, bBlue);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);

  // --- TABLEAU DES LIGNES ---
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: invoice.lines.map((l) => [
      l.description,
      l.quantity.toString(),
      `${Number(l.unit_price).toFixed(2)} $`,
      `${Number(l.line_total).toFixed(2)} $`,
    ]),
    theme: 'grid',
    styles: { fontSize: 10, font: 'helvetica', textColor: 30, cellPadding: 5 },
    headStyles: {
      fillColor: [rGrey, gGrey, bGrey],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- INFOS REGISTRE ---
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('RCCM: CD/KNG/RCCM/20-A-01528', margin, finalY + 4);
  doc.text('ID.NAT: 01-04701-N05692A | N° IMPOT: A2171268P', margin, finalY + 10);

  // --- TOTAUX ---
  const colLabelX = pageWidth - margin - 80;
  let yTotal = finalY;
  const rowHeight = 10;

  const drawTotalRow = (label: string, value: string, isLast: boolean) => {
    doc.setFillColor(rGrey, gGrey, bGrey);
    doc.rect(colLabelX, yTotal, 40, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(label, colLabelX + 2, yTotal + 6.5);

    const vR = isLast ? rDarkBlue : rBlue;
    const vG = isLast ? gDarkBlue : gBlue;
    const vB = isLast ? bDarkBlue : bBlue;
    doc.setFillColor(vR, vG, vB);
    doc.rect(colLabelX + 40, yTotal, 40, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(value, colLabelX + 40 + 2, yTotal + 6.5);
    yTotal += rowHeight;
  };

  drawTotalRow('Sous-total', `${Number(invoice.total_ht).toFixed(2)} $`, false);
  drawTotalRow(`TVA (${invoice.tva_rate}%)`, `${(Number(invoice.total_ttc) - Number(invoice.total_ht)).toFixed(2)} $`, false);
  drawTotalRow('Total TTC', `${Number(invoice.total_ttc).toFixed(2)} $`, true);

  // --- FOOTER ---
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setFillColor(rBlue, gBlue, bBlue);
  doc.rect(margin, footerY, pageWidth - margin * 2, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Merci de votre confiance !', pageWidth / 2, footerY + 9, { align: 'center' });

  doc.save(`Facture_${invoice.invoice_number}.pdf`);
};