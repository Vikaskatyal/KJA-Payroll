// Local Storage utility for data persistence

import { Employee } from '../types/employee';
import { PayrollSummary, PayrollHistory } from '../types/payroll';

const STORAGE_KEYS = {
  EMPLOYEES: 'payroll_employees',
  PAYROLL_HISTORY: 'payroll_history',
  PAYROLL_DATA: 'payroll_data_',
  SETTINGS: 'payroll_settings',
  LAST_PAYROLL_DUES: 'payroll_last_dues_',
};

// ===== Employee Storage =====
export function saveEmployees(employees: Employee[]): void {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
}

export function loadEmployees(): Employee[] {
  const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
  return data ? JSON.parse(data) : [];
}

export function addEmployee(employee: Employee): void {
  const employees = loadEmployees();
  employees.push(employee);
  saveEmployees(employees);
}

export function updateEmployee(updated: Employee): void {
  const employees = loadEmployees();
  const index = employees.findIndex((e) => e.id === updated.id);
  if (index !== -1) {
    employees[index] = updated;
    saveEmployees(employees);
  }
}

export function deleteEmployee(id: string): void {
  const employees = loadEmployees().filter((e) => e.id !== id);
  saveEmployees(employees);
}

// ===== Payroll History Storage =====
export function savePayrollHistory(history: PayrollHistory[]): void {
  localStorage.setItem(STORAGE_KEYS.PAYROLL_HISTORY, JSON.stringify(history));
}

export function loadPayrollHistory(): PayrollHistory[] {
  const data = localStorage.getItem(STORAGE_KEYS.PAYROLL_HISTORY);
  return data ? JSON.parse(data) : [];
}

// ===== Payroll Data Storage =====
export function savePayrollData(month: number, year: number, data: PayrollSummary): void {
  const key = `${STORAGE_KEYS.PAYROLL_DATA}${year}_${month}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadPayrollData(month: number, year: number): PayrollSummary | null {
  const key = `${STORAGE_KEYS.PAYROLL_DATA}${year}_${month}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// ===== Due from last cycle =====
export function saveDuesFromLastCycle(month: number, year: number, dues: Record<string, number>): void {
  const key = `${STORAGE_KEYS.LAST_PAYROLL_DUES}${year}_${month}`;
  localStorage.setItem(key, JSON.stringify(dues));
}

export function loadDuesFromLastCycle(month: number, year: number): Record<string, number> {
  // Get dues from previous month's payroll
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const key = `${STORAGE_KEYS.LAST_PAYROLL_DUES}${prevYear}_${prevMonth}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}

// ===== Settings =====
export interface AppSettings {
  companyName: string;
  companyAddress: string;
  defaultState: string;
  pfEnabled: boolean;
  esiEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Savika Consultancy Services Pvt. Ltd.',
  companyAddress: '',
  defaultState: 'Chhattisgarh',
  pfEnabled: true,
  esiEnabled: true,
};

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadSettings(): AppSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
}

// ===== Utility =====
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
