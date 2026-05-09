// Payroll calculation types

export interface PayrollEarnings {
  basic: number;
  bonus: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  medicalAllowance: number;
  otherAllowance: number;
  overtimeSalary: number;
  travellingAllowance: number;
  customEarnings: { name: string; amount: number }[];
  grossSalary: number;
}

export interface PayrollDeductions {
  employeePF: number;
  employerPF: number;
  employeeESI: number;
  employerESI: number;
  professionalTax: number;
  tds: number;
  salaryAdvanceRecovery: number;
  dueInNextCycle: number; // Basic / 3
  otherDeductions: number;
  totalDeductions: number;
}

export interface PayrollRecord {
  // Employee Info
  sNo: number;
  empCode: string;
  name: string;
  location: string;
  department: string;
  designation: string;
  bankAccountNo: string;
  uan: string;
  dateOfJoining: string;

  // Attendance
  totalCalendarDays: number;
  lwpDays: number;
  paidDays: number;
  workingDaysForTA: number;
  remarks: string;

  // Earnings
  earnings: PayrollEarnings;

  // Deductions
  deductions: PayrollDeductions;

  // Net Pay
  netAmount: number; // Gross - Total Deductions
  netPaymentForMonth: number; // Net Amount - Due in next cycle + Due from last cycle
  dueFromLastCycle: number; // Carried forward from previous month

  // PF & ESI details
  pfApplicable: boolean;
  pfWorking: number; // PF calculation base
  tdsApplicable: boolean;
  esiApplicable: boolean;
  grossEarningForESI: number;
  netEarningForESI: number;

  // Service details
  periodOfService: string;
  completedYears: number;
  gratuity: number;

  // Totals
  totalSalary: number;
  grossSalaryForMonth: number;
  employeeEmployerDeductions: number;
  totalDeductions: number;
}

export interface PayrollSummary {
  month: number;
  year: number;
  monthName: string;
  generatedOn: string;
  generatedBy: string;
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetPayment: number;
  totalPFEmployee: number;
  totalPFEmployer: number;
  totalESIEmployee: number;
  totalESIEmployer: number;
  totalPT: number;
  totalTDS: number;
  records: PayrollRecord[];
}

export interface PayrollHistory {
  id: string;
  month: number;
  year: number;
  monthName: string;
  generatedOn: string;
  totalEmployees: number;
  totalNetPayment: number;
  status: 'draft' | 'finalized';
}
