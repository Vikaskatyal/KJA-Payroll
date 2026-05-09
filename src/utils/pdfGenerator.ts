// PDF Payslip Generator
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollRecord } from '../types/payroll';
import { MONTHS, formatNumber } from './constants';

export function generatePayslipPDF(record: PayrollRecord, month: number, year: number, companyName: string): void {
  const doc = new jsPDF();
  const monthName = MONTHS[month - 1];
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(26, 35, 66);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName || 'Savika Consultancy Services Pvt. Ltd.', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pay Slip for ${monthName} ${year}`, pageWidth / 2, 25, { align: 'center' });
  doc.text('CONFIDENTIAL', pageWidth / 2, 32, { align: 'center' });

  // Employee Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const infoY = 45;
  const leftCol = 14;
  const rightCol = pageWidth / 2 + 10;

  const infoItems = [
    [['Employee Code', record.empCode], ['Name', record.name]],
    [['Location', record.location], ['Department', record.department || '-']],
    [['Date of Joining', record.dateOfJoining], ['Designation', record.designation || '-']],
    [['Bank Account', record.bankAccountNo], ['UAN', record.uan || 'N/A']],
    [['Paid Days', `${record.paidDays} / ${record.totalCalendarDays}`], ['LWP Days', String(record.lwpDays)]],
  ];

  infoItems.forEach((pair, idx) => {
    const y = infoY + idx * 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`${pair[0][0]}:`, leftCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(pair[0][1], leftCol + 40, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${pair[1][0]}:`, rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.text(pair[1][1], rightCol + 40, y);
  });

  // Earnings & Deductions Table
  const e = record.earnings;
  const d = record.deductions;
  const earningsRows = [
    ['Basic', formatNumber(e.basic)],
    ['Bonus', formatNumber(e.bonus)],
  ];
  if (e.hra > 0) earningsRows.push(['HRA', formatNumber(e.hra)]);
  if (e.specialAllowance > 0) earningsRows.push(['Special Allowance', formatNumber(e.specialAllowance)]);
  if (e.conveyance > 0) earningsRows.push(['Conveyance', formatNumber(e.conveyance)]);
  if (e.medicalAllowance > 0) earningsRows.push(['Medical Allowance', formatNumber(e.medicalAllowance)]);
  if (e.otherAllowance > 0) earningsRows.push(['Other Allowance', formatNumber(e.otherAllowance)]);
  if (e.overtimeSalary > 0) earningsRows.push(['Overtime', formatNumber(e.overtimeSalary)]);
  if (e.travellingAllowance > 0) earningsRows.push(['Travelling Allowance', formatNumber(e.travellingAllowance)]);

  const deductionRows: string[][] = [];
  if (d.employeePF > 0) deductionRows.push(['PF (Employee)', formatNumber(d.employeePF)]);
  if (d.employeeESI > 0) deductionRows.push(['ESI (Employee)', formatNumber(d.employeeESI)]);
  if (d.professionalTax > 0) deductionRows.push(['Professional Tax', formatNumber(d.professionalTax)]);
  if (d.tds > 0) deductionRows.push(['TDS', formatNumber(d.tds)]);
  if (d.salaryAdvanceRecovery > 0) deductionRows.push(['Advance Recovery', formatNumber(d.salaryAdvanceRecovery)]);

  const maxRows = Math.max(earningsRows.length, deductionRows.length);
  const tableBody: string[][] = [];
  for (let i = 0; i < maxRows; i++) {
    tableBody.push([
      earningsRows[i]?.[0] || '',
      earningsRows[i]?.[1] || '',
      deductionRows[i]?.[0] || '',
      deductionRows[i]?.[1] || '',
    ]);
  }
  // Totals
  tableBody.push([
    'Gross Salary', formatNumber(e.grossSalary),
    'Total Deductions', formatNumber(d.totalDeductions),
  ]);

  autoTable(doc, {
    startY: infoY + infoItems.length * 8 + 5,
    head: [['Earnings', 'Amount (₹)', 'Deductions', 'Amount (₹)']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [26, 35, 66], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
  });

  // Net Pay summary
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFillColor(240, 245, 255);
  doc.roundedRect(14, finalY, pageWidth - 28, 30, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Net Amount:', 20, finalY + 10);
  doc.text(formatNumber(record.netAmount), 80, finalY + 10);
  doc.text('Due in Next Cycle:', 110, finalY + 10);
  doc.text(formatNumber(d.dueInNextCycle), 170, finalY + 10);
  doc.setFontSize(12);
  doc.setTextColor(0, 100, 0);
  doc.text('Net Payment:', 20, finalY + 23);
  doc.text(`₹ ${formatNumber(record.netPaymentForMonth)}`, 80, finalY + 23);

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.text('This is a system-generated payslip. For queries, contact HR.', pageWidth / 2, 285, { align: 'center' });

  doc.save(`Payslip_${record.empCode}_${record.name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`);
}

export function generateAllPayslips(records: PayrollRecord[], month: number, year: number, companyName: string): void {
  records.forEach((record) => {
    generatePayslipPDF(record, month, year, companyName);
  });
}
