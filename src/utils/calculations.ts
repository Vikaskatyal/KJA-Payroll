// Payroll Calculation Engine

import { Employee, INDIAN_STATES } from '../types/employee';
import { AttendanceRecord } from '../types/attendance';
import { PayrollRecord, PayrollEarnings, PayrollDeductions } from '../types/payroll';
import {
  PF_RATE_EMPLOYEE,
  PF_RATE_EMPLOYER,
  PF_BASIC_LIMIT,
  ESI_RATE_EMPLOYEE,
  ESI_RATE_EMPLOYER,
  ESI_GROSS_LIMIT,
  DUE_NEXT_CYCLE_DIVISOR,
} from './constants';

/**
 * Calculate Professional Tax based on state and gross salary
 */
export function calculatePT(state: string, grossSalary: number): number {
  const stateConfig = INDIAN_STATES.find((s) => s.name === state || s.code === state);
  if (!stateConfig) return 0;

  for (const slab of stateConfig.ptSlabs) {
    if (grossSalary >= slab.minSalary && grossSalary <= slab.maxSalary) {
      return slab.tax;
    }
  }
  return 0;
}

/**
 * Calculate period of service
 */
export function calculateServicePeriod(dateOfJoining: string, currentDate: Date): { years: number; months: number; display: string } {
  const joinDate = new Date(dateOfJoining);
  let years = currentDate.getFullYear() - joinDate.getFullYear();
  let months = currentDate.getMonth() - joinDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    display: `${years} Yr ${months} Mn`,
  };
}

/**
 * Calculate Gratuity (if completed 5+ years)
 * Gratuity = (Last drawn salary × 15 × No. of years) / 26
 */
export function calculateGratuity(basicPlusDA: number, completedYears: number): number {
  if (completedYears < 5) return 0;
  return Math.round((basicPlusDA * 15 * completedYears) / 26);
}

/**
 * Main payroll calculation for a single employee
 */
export function calculatePayroll(
  employee: Employee,
  attendance: AttendanceRecord,
  month: number,
  year: number,
  totalCalendarDays: number,
  dueFromLastCycle: number = 0,
  salaryAdvanceRecovery: number = 0,
): PayrollRecord {
  const sc = employee.salaryComponents;

  // ===== Calculate Pro-rated amounts based on LWP =====
  const lwpDays = attendance.lwpDays || 0;
  const paidDays = totalCalendarDays - lwpDays;
  const proRataFactor = paidDays / totalCalendarDays;

  // Pro-rated salary components
  const proRatedBasic = Math.round(sc.basic * proRataFactor);
  const proRatedBonus = Math.round(sc.bonus * proRataFactor);
  const proRatedHRA = Math.round(sc.hra * proRataFactor);
  const proRatedSpecialAllowance = Math.round(sc.specialAllowance * proRataFactor);
  const proRatedConveyance = Math.round(sc.conveyance * proRataFactor);
  const proRatedMedical = Math.round(sc.medicalAllowance * proRataFactor);
  const proRatedOtherAllowance = Math.round(sc.otherAllowance * proRataFactor);

  // Travelling Allowance = Working Days for TA × Travelling Cost Per Day
  const travellingAllowance = Math.round(attendance.workingDaysForTA * attendance.travellingCostPerDay);

  // Overtime (placeholder — will be configured later)
  const overtimeSalary = 0; // TODO: implement overtime calculation

  // Custom earnings
  const customEarnings = (sc.customComponents || []).map((c) => ({
    name: c.name,
    amount: Math.round(c.amount * proRataFactor),
  }));
  const customEarningsTotal = customEarnings.reduce((sum, c) => sum + c.amount, 0);

  // Gross Salary
  const grossSalary =
    proRatedBasic +
    proRatedBonus +
    proRatedHRA +
    proRatedSpecialAllowance +
    proRatedConveyance +
    proRatedMedical +
    proRatedOtherAllowance +
    travellingAllowance +
    overtimeSalary +
    customEarningsTotal;

  const earnings: PayrollEarnings = {
    basic: proRatedBasic,
    bonus: proRatedBonus,
    hra: proRatedHRA,
    specialAllowance: proRatedSpecialAllowance,
    conveyance: proRatedConveyance,
    medicalAllowance: proRatedMedical,
    otherAllowance: proRatedOtherAllowance,
    overtimeSalary,
    travellingAllowance,
    customEarnings,
    grossSalary,
  };

  // ===== Deductions =====

  // PF Calculation
  let employeePF = 0;
  let employerPF = 0;
  let pfWorking = 0;
  if (employee.pfApplicable) {
    const pfBase = Math.min(proRatedBasic, PF_BASIC_LIMIT);
    pfWorking = pfBase;
    employeePF = Math.round(pfBase * PF_RATE_EMPLOYEE);
    employerPF = Math.round(pfBase * PF_RATE_EMPLOYER);
  }

  // ESI Calculation
  let employeeESI = 0;
  let employerESI = 0;
  let grossEarningForESI = grossSalary;
  let netEarningForESI = 0;
  const esiApplicable = employee.esiApplicable && grossSalary <= ESI_GROSS_LIMIT;
  if (esiApplicable) {
    employeeESI = Math.round(grossSalary * ESI_RATE_EMPLOYEE);
    employerESI = Math.round(grossSalary * ESI_RATE_EMPLOYER);
    netEarningForESI = grossSalary - employeeESI;
  }

  // Professional Tax
  const professionalTax = calculatePT(employee.state, grossSalary);

  // TDS
  const tds = employee.tdsApplicable ? (employee.tdsAmount || 0) : 0;

  // Due in next payment cycle = Basic / 3
  const dueInNextCycle = Math.round(sc.basic / DUE_NEXT_CYCLE_DIVISOR);

  // Total Deductions (employee side only)
  const totalDeductions = employeePF + employeeESI + professionalTax + tds + salaryAdvanceRecovery;

  const deductions: PayrollDeductions = {
    employeePF,
    employerPF,
    employeeESI,
    employerESI,
    professionalTax,
    tds,
    salaryAdvanceRecovery,
    dueInNextCycle,
    otherDeductions: 0,
    totalDeductions,
  };

  // ===== Net Pay =====
  const netAmount = grossSalary - totalDeductions;
  const netPaymentForMonth = netAmount - dueInNextCycle + dueFromLastCycle;

  // ===== Service details =====
  const currentDate = new Date(year, month - 1, 28); // End of payroll month approx
  const service = calculateServicePeriod(employee.dateOfJoining, currentDate);
  const gratuity = calculateGratuity(proRatedBasic, service.years);

  const record: PayrollRecord = {
    sNo: 0, // Will be set by caller
    empCode: employee.empCode,
    name: employee.name,
    location: employee.location,
    department: employee.department || '',
    designation: employee.designation || '',
    bankAccountNo: employee.bankAccountNo,
    uan: employee.uan || 'NO UAN',
    dateOfJoining: employee.dateOfJoining,

    totalCalendarDays,
    lwpDays,
    paidDays,
    workingDaysForTA: attendance.workingDaysForTA,
    remarks: attendance.remarks,

    earnings,
    deductions,

    netAmount,
    netPaymentForMonth,
    dueFromLastCycle,

    pfApplicable: employee.pfApplicable,
    pfWorking,
    tdsApplicable: employee.tdsApplicable,
    esiApplicable,
    grossEarningForESI: esiApplicable ? grossEarningForESI : 0,
    netEarningForESI: esiApplicable ? netEarningForESI : 0,

    periodOfService: service.display,
    completedYears: service.years,
    gratuity,

    totalSalary: employee.grossSalary,
    grossSalaryForMonth: grossSalary,
    employeeEmployerDeductions: employeePF + employerPF + employeeESI + employerESI,
    totalDeductions,
  };

  return record;
}
