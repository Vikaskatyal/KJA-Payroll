import * as XLSX from 'xlsx';
import { PayrollSummary, PayrollRecord } from '../types/payroll';
import { MONTHS } from './constants';

function sum(records: PayrollRecord[], getter: (r: PayrollRecord) => number): number {
  return records.reduce((s, r) => s + getter(r), 0);
}

export function generatePayrollExcel(summary: PayrollSummary): void {
  const wb = XLSX.utils.book_new();
  const monthName = MONTHS[summary.month - 1];
  const headers = [
    'S.No.','Emp Code','Name','Location','LWP','Paid Days',
    'Basic','Bonus','HRA','Special Allowance','Conveyance',
    'Medical','Other Allowance','OT Salary','Travelling Allowance','Gross Salary',
    'Employee PF','Employer PF','Employee ESI','Employer ESI',
    'Professional Tax','TDS','Total Deductions',
    'Net Amount','Due Next Cycle','Due Last Cycle','Net Payment',
    'Bank Account','UAN','PF Applicable','PF Working',
    'Gross Earning ESIC','Period of Service','Gratuity',
  ];
  const rows: (string|number)[][] = [
    [`Payroll - ${monthName} ${summary.year}`],[`Generated: ${summary.generatedOn}`],[],headers
  ];
  summary.records.forEach((r,i) => {
    rows.push([i+1,r.empCode,r.name,r.location,r.lwpDays,r.paidDays,
      r.earnings.basic,r.earnings.bonus,r.earnings.hra,r.earnings.specialAllowance,
      r.earnings.conveyance,r.earnings.medicalAllowance,r.earnings.otherAllowance,
      r.earnings.overtimeSalary,r.earnings.travellingAllowance,r.earnings.grossSalary,
      r.deductions.employeePF,r.deductions.employerPF,r.deductions.employeeESI,r.deductions.employerESI,
      r.deductions.professionalTax,r.deductions.tds,r.deductions.totalDeductions,
      r.netAmount,r.deductions.dueInNextCycle,r.dueFromLastCycle,r.netPaymentForMonth,
      r.bankAccountNo,r.uan,r.pfApplicable?'Yes':'No',r.pfWorking,
      r.grossEarningForESI,r.periodOfService,r.gratuity,
    ]);
  });
  rows.push([]);
  rows.push(['','','TOTALS','','','',
    sum(summary.records,r=>r.earnings.basic),sum(summary.records,r=>r.earnings.bonus),
    sum(summary.records,r=>r.earnings.hra),sum(summary.records,r=>r.earnings.specialAllowance),
    sum(summary.records,r=>r.earnings.conveyance),sum(summary.records,r=>r.earnings.medicalAllowance),
    sum(summary.records,r=>r.earnings.otherAllowance),sum(summary.records,r=>r.earnings.overtimeSalary),
    sum(summary.records,r=>r.earnings.travellingAllowance),sum(summary.records,r=>r.earnings.grossSalary),
    sum(summary.records,r=>r.deductions.employeePF),sum(summary.records,r=>r.deductions.employerPF),
    sum(summary.records,r=>r.deductions.employeeESI),sum(summary.records,r=>r.deductions.employerESI),
    sum(summary.records,r=>r.deductions.professionalTax),sum(summary.records,r=>r.deductions.tds),
    sum(summary.records,r=>r.deductions.totalDeductions),
    sum(summary.records,r=>r.netAmount),sum(summary.records,r=>r.deductions.dueInNextCycle),
    sum(summary.records,r=>r.dueFromLastCycle),sum(summary.records,r=>r.netPaymentForMonth),
  ]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = headers.map(h=>({wch:Math.max(String(h).length+2,14)}));
  XLSX.utils.book_append_sheet(wb,ws,'Payroll');

  // PF Sheet
  const pfH = ['S.No.','Emp Code','Name','UAN','PF Working','Employee PF','Employer PF','Total PF'];
  const pfR: (string|number)[][] = [[`PF Summary - ${monthName} ${summary.year}`],[],pfH];
  let pn=0;
  summary.records.filter(r=>r.pfApplicable).forEach(r=>{
    pn++;pfR.push([pn,r.empCode,r.name,r.uan,r.pfWorking,r.deductions.employeePF,r.deductions.employerPF,r.deductions.employeePF+r.deductions.employerPF]);
  });
  const pws=XLSX.utils.aoa_to_sheet(pfR);pws['!cols']=pfH.map(h=>({wch:Math.max(String(h).length+2,14)}));
  XLSX.utils.book_append_sheet(wb,pws,'PF Summary');

  // ESI Sheet
  const eH=['S.No.','Emp Code','Name','Gross','Employee ESI','Employer ESI','Total ESI'];
  const eR:(string|number)[][]= [[`ESI Summary - ${monthName} ${summary.year}`],[],eH];
  let en=0;
  summary.records.filter(r=>r.esiApplicable).forEach(r=>{
    en++;eR.push([en,r.empCode,r.name,r.grossEarningForESI,r.deductions.employeeESI,r.deductions.employerESI,r.deductions.employeeESI+r.deductions.employerESI]);
  });
  const ews=XLSX.utils.aoa_to_sheet(eR);ews['!cols']=eH.map(h=>({wch:Math.max(String(h).length+2,14)}));
  XLSX.utils.book_append_sheet(wb,ews,'ESI Summary');

  XLSX.writeFile(wb,`Payroll_${monthName}_${summary.year}.xlsx`);
}

export function generateBankStatement(summary: PayrollSummary): void {
  const monthName=MONTHS[summary.month-1];
  const wb=XLSX.utils.book_new();
  const h=['S.No.','Emp Code','Name','Bank Account','Net Payment'];
  const rows:(string|number)[][]= [[`Bank Statement - ${monthName} ${summary.year}`],[],h];
  summary.records.forEach((r,i)=>{rows.push([i+1,r.empCode,r.name,r.bankAccountNo,r.netPaymentForMonth]);});
  rows.push([]);rows.push(['','','TOTAL','',sum(summary.records,r=>r.netPaymentForMonth)]);
  const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=h.map(h=>({wch:20}));
  XLSX.utils.book_append_sheet(wb,ws,'Bank Statement');
  XLSX.writeFile(wb,`Bank_Statement_${monthName}_${summary.year}.xlsx`);
}
