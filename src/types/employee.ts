// Employee and Salary Component Types

export interface SalaryComponents {
  basic: number;
  bonus: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  medicalAllowance: number;
  otherAllowance: number;
  travellingAllowancePerDay: number;
  // Any additional custom components
  customComponents?: { name: string; amount: number }[];
}

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  location: string;
  department?: string;
  designation?: string;
  dateOfJoining: string; // ISO date string
  bankAccountNo: string;
  // PF Settings
  pfApplicable: boolean;
  uan: string;
  // TDS
  tdsApplicable: boolean;
  tdsAmount?: number; // Fixed TDS amount per month if applicable
  // ESI - auto-calculated based on gross salary threshold
  esiApplicable: boolean;
  // Salary Components
  salaryComponents: SalaryComponents;
  // Computed
  grossSalary: number; // Sum of all salary components (excluding TA per day)
  // Status
  isActive: boolean;
  // State for PT calculation
  state: string;
  // Remarks
  remarks?: string;
}

export interface EmployeeFormData {
  empCode: string;
  name: string;
  location: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  bankAccountNo: string;
  pfApplicable: boolean;
  uan: string;
  tdsApplicable: boolean;
  tdsAmount: number;
  state: string;
  basic: number;
  bonus: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  medicalAllowance: number;
  otherAllowance: number;
  travellingAllowancePerDay: number;
  remarks: string;
}

// Professional Tax slabs by state
export interface PTSlab {
  minSalary: number;
  maxSalary: number;
  tax: number;
}

export interface StateConfig {
  name: string;
  code: string;
  ptSlabs: PTSlab[];
}

// Locations used in the client's business
export const DEFAULT_LOCATIONS = [
  'KGGC VK',
  'KGGC GC',
  'KGGC N',
];

export const INDIAN_STATES: StateConfig[] = [
  {
    name: 'Chhattisgarh',
    code: 'CG',
    ptSlabs: [
      { minSalary: 0, maxSalary: 12500, tax: 0 },
      { minSalary: 12501, maxSalary: 15000, tax: 150 },
      { minSalary: 15001, maxSalary: 25000, tax: 150 },
      { minSalary: 25001, maxSalary: 999999999, tax: 200 },
    ],
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    ptSlabs: [
      { minSalary: 0, maxSalary: 18750, tax: 0 },
      { minSalary: 18751, maxSalary: 25000, tax: 125 },
      { minSalary: 25001, maxSalary: 33333, tax: 167 },
      { minSalary: 33334, maxSalary: 999999999, tax: 208 },
    ],
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    ptSlabs: [
      { minSalary: 0, maxSalary: 7500, tax: 0 },
      { minSalary: 7501, maxSalary: 10000, tax: 175 },
      { minSalary: 10001, maxSalary: 999999999, tax: 200 },
    ],
  },
  {
    name: 'Karnataka',
    code: 'KA',
    ptSlabs: [
      { minSalary: 0, maxSalary: 15000, tax: 0 },
      { minSalary: 15001, maxSalary: 999999999, tax: 200 },
    ],
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    ptSlabs: [
      { minSalary: 0, maxSalary: 12000, tax: 0 },
      { minSalary: 12001, maxSalary: 999999999, tax: 200 },
    ],
  },
  {
    name: 'Delhi',
    code: 'DL',
    ptSlabs: [
      { minSalary: 0, maxSalary: 999999999, tax: 0 },
    ],
  },
  {
    name: 'Other',
    code: 'OT',
    ptSlabs: [
      { minSalary: 0, maxSalary: 15000, tax: 0 },
      { minSalary: 15001, maxSalary: 999999999, tax: 200 },
    ],
  },
];
