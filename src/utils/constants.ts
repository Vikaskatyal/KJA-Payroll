// Constants for payroll calculations

export const PF_RATE_EMPLOYEE = 0.12; // 12% of Basic
export const PF_RATE_EMPLOYER = 0.12; // 12% of Basic
export const PF_BASIC_LIMIT = 15000; // PF applicable on Basic up to ₹15,000

export const ESI_RATE_EMPLOYEE = 0.0075; // 0.75%
export const ESI_RATE_EMPLOYER = 0.0325; // 3.25%
export const ESI_GROSS_LIMIT = 21000; // ESI applicable for gross ≤ ₹21,000

export const DUE_NEXT_CYCLE_DIVISOR = 3; // Due in next cycle = Basic / 3

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Get calendar days for a given month/year
export function getCalendarDays(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with commas
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
