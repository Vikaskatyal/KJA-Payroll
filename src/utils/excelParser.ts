// Excel Parser - Parse attendance and employee master Excel files

import * as XLSX from 'xlsx';
import { AttendanceRecord, AttendanceSheet } from '../types/attendance';
import { Employee, SalaryComponents } from '../types/employee';
import { generateId } from './storage';
import { getCalendarDays } from './constants';

/**
 * Parse attendance Excel file
 * Expected columns: S.No, New Emp Code, Name, Location, Salary, Remarks, LWP,
 * No.of Working Days For TA, Travelling Cost per day,
 * Overtime Hours @ Hourly Wage, Overtime Hours @ Twice of Hourly Wages
 */
export function parseAttendanceExcel(file: File): Promise<AttendanceSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get all data as JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];

        // Try to extract month/year from header
        let month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();
        let preparedOn = '';
        let preparedBy = '';

        // Search first 5 rows for metadata
        for (let i = 0; i < Math.min(5, rawData.length); i++) {
          const rowStr = rawData[i].join(' ').toLowerCase();
          if (rowStr.includes('prepared on')) {
            const match = rawData[i].join(' ').match(/prepared\s*on\s*:\s*(.*)/i);
            if (match) preparedOn = match[1].trim();
          }
          if (rowStr.includes('pic') || rowStr.includes('prepared by')) {
            const match = rawData[i].join(' ').match(/pic\s*:\s*(.*)/i) || rawData[i].join(' ').match(/prepared\s*by\s*:\s*(.*)/i);
            if (match) preparedBy = match[1].trim();
          }
          // Extract month and year from sheet title
          const monthMatch = rawData[i].join(' ').match(/(january|february|march|april|may|june|july|august|september|october|november|december)[_\s,]*(\d{4})/i);
          if (monthMatch) {
            const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
            month = monthNames.indexOf(monthMatch[1].toLowerCase()) + 1;
            year = parseInt(monthMatch[2]);
          }
        }

        // Find header row (look for "S. No" or "S.No" or "Sl" or "Emp Code" column)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i].map((c) => String(c).toLowerCase().trim());
          if (
            row.some((c) => c.includes('s. no') || c.includes('s.no') || c === 'sl' || c === 'sno') ||
            row.some((c) => c.includes('emp code') || c.includes('employee code'))
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not find header row. Expected columns: S.No, Emp Code, Name, Location, Salary, etc.');
        }

        const headers = rawData[headerRowIndex].map((h) => String(h).toLowerCase().trim());

        // Map columns
        const findCol = (keywords: string[]): number => {
          for (const kw of keywords) {
            const idx = headers.findIndex((h) => h.includes(kw));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const colMap = {
          sNo: findCol(['s. no', 's.no', 'sl', 'sno']),
          empCode: findCol(['emp code', 'employee code', 'new emp']),
          name: findCol(['name']),
          location: findCol(['location']),
          salary: findCol(['salary']),
          remarks: findCol(['remark']),
          lwp: findCol(['lwp']),
          workingDaysTA: findCol(['working days', 'working day', 'no.of working', 'days for ta']),
          travellingCost: findCol(['travelling cost', 'travel cost', 'travelling']),
          otRegular: findCol(['overtime hours', 'ot hours']),
          otDouble: findCol(['twice', 'double']),
        };

        // Parse data rows
        const records: AttendanceRecord[] = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const empCode = colMap.empCode >= 0 ? String(row[colMap.empCode]).trim() : '';
          const name = colMap.name >= 0 ? String(row[colMap.name]).trim() : '';

          // Skip empty rows
          if (!empCode && !name) continue;
          // Skip if S.No is not a number
          const sNo = colMap.sNo >= 0 ? Number(row[colMap.sNo]) : 0;
          if (isNaN(sNo) || sNo === 0) continue;

          records.push({
            sNo,
            empCode,
            name,
            location: colMap.location >= 0 ? String(row[colMap.location]).trim() : '',
            salary: colMap.salary >= 0 ? Number(row[colMap.salary]) || 0 : 0,
            remarks: colMap.remarks >= 0 ? String(row[colMap.remarks]).trim() : '',
            lwpDays: colMap.lwp >= 0 ? Number(row[colMap.lwp]) || 0 : 0,
            workingDaysForTA: colMap.workingDaysTA >= 0 ? Number(row[colMap.workingDaysTA]) || 0 : 0,
            travellingCostPerDay: colMap.travellingCost >= 0 ? Number(row[colMap.travellingCost]) || 0 : 0,
            overtimeHoursRegular: colMap.otRegular >= 0 ? Number(row[colMap.otRegular]) || 0 : 0,
            overtimeHoursDouble: colMap.otDouble >= 0 ? Number(row[colMap.otDouble]) || 0 : 0,
          });
        }

        const totalCalendarDays = getCalendarDays(month, year);

        resolve({
          month,
          year,
          preparedOn,
          preparedBy,
          totalCalendarDays,
          records,
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse Employee Master Excel for bulk import
 * Expected columns: Emp Code, Name, Location, State, Date of Joining,
 * Bank Account, PF Applicable, UAN, TDS Applicable,
 * Basic, Bonus, HRA, Special Allowance, Conveyance,
 * Medical Allowance, Other Allowance, TA Per Day
 */
export function parseEmployeeMasterExcel(file: File): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];

        // Find header row
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i].map((c) => String(c).toLowerCase().trim());
          if (
            row.some((c) => c.includes('emp code') || c.includes('employee code') || c.includes('code')) &&
            row.some((c) => c.includes('name'))
          ) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not find header row in Employee Master Excel.');
        }

        const headers = rawData[headerRowIndex].map((h) => String(h).toLowerCase().trim());

        const findCol = (keywords: string[]): number => {
          for (const kw of keywords) {
            const idx = headers.findIndex((h) => h.includes(kw));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const colMap = {
          empCode: findCol(['emp code', 'employee code', 'code']),
          name: findCol(['name']),
          location: findCol(['location']),
          state: findCol(['state']),
          department: findCol(['department', 'dept']),
          designation: findCol(['designation', 'desig']),
          doj: findCol(['date of joining', 'doj', 'joining']),
          bankAccount: findCol(['bank account', 'bank', 'account no']),
          pfApplicable: findCol(['pf applicable', 'pf']),
          uan: findCol(['uan']),
          tdsApplicable: findCol(['tds applicable', 'tds']),
          tdsAmount: findCol(['tds amount']),
          basic: findCol(['basic']),
          bonus: findCol(['bonus']),
          hra: findCol(['hra']),
          specialAllowance: findCol(['special allow', 'special']),
          conveyance: findCol(['conveyance', 'conv']),
          medicalAllowance: findCol(['medical', 'med allow']),
          otherAllowance: findCol(['other allow', 'other']),
          taPerDay: findCol(['ta per day', 'travelling', 'ta']),
        };

        const employees: Employee[] = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const empCode = colMap.empCode >= 0 ? String(row[colMap.empCode]).trim() : '';
          const name = colMap.name >= 0 ? String(row[colMap.name]).trim() : '';
          if (!empCode && !name) continue;

          const getNum = (colIdx: number): number => {
            if (colIdx < 0) return 0;
            return Number(row[colIdx]) || 0;
          };

          const getBool = (colIdx: number): boolean => {
            if (colIdx < 0) return false;
            const val = String(row[colIdx]).toLowerCase().trim();
            return val === 'yes' || val === 'y' || val === 'true' || val === '1';
          };

          const salaryComponents: SalaryComponents = {
            basic: getNum(colMap.basic),
            bonus: getNum(colMap.bonus),
            hra: getNum(colMap.hra),
            specialAllowance: getNum(colMap.specialAllowance),
            conveyance: getNum(colMap.conveyance),
            medicalAllowance: getNum(colMap.medicalAllowance),
            otherAllowance: getNum(colMap.otherAllowance),
            travellingAllowancePerDay: getNum(colMap.taPerDay),
          };

          const grossSalary =
            salaryComponents.basic +
            salaryComponents.bonus +
            salaryComponents.hra +
            salaryComponents.specialAllowance +
            salaryComponents.conveyance +
            salaryComponents.medicalAllowance +
            salaryComponents.otherAllowance;

          // Parse date of joining
          let doj = '';
          if (colMap.doj >= 0) {
            const rawDoj = row[colMap.doj];
            if (typeof rawDoj === 'number') {
              // Excel serial date
              const excelDate = XLSX.SSF.parse_date_code(rawDoj);
              doj = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            } else {
              doj = String(rawDoj).trim();
            }
          }

          employees.push({
            id: generateId(),
            empCode,
            name,
            location: colMap.location >= 0 ? String(row[colMap.location]).trim() : '',
            department: colMap.department >= 0 ? String(row[colMap.department]).trim() : '',
            designation: colMap.designation >= 0 ? String(row[colMap.designation]).trim() : '',
            dateOfJoining: doj,
            bankAccountNo: colMap.bankAccount >= 0 ? String(row[colMap.bankAccount]).trim() : '',
            pfApplicable: getBool(colMap.pfApplicable),
            uan: colMap.uan >= 0 ? String(row[colMap.uan]).trim() : '',
            tdsApplicable: getBool(colMap.tdsApplicable),
            tdsAmount: getNum(colMap.tdsAmount),
            esiApplicable: grossSalary <= 21000,
            salaryComponents,
            grossSalary,
            isActive: true,
            state: colMap.state >= 0 ? String(row[colMap.state]).trim() : 'Chhattisgarh',
          });
        }

        resolve(employees);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a sample employee master Excel template for download
 */
export function generateEmployeeTemplate(): void {
  const headers = [
    'Emp Code', 'Name', 'Location', 'State', 'Department', 'Designation',
    'Date of Joining', 'Bank Account', 'PF Applicable', 'UAN',
    'TDS Applicable', 'TDS Amount',
    'Basic', 'Bonus', 'HRA', 'Special Allowance', 'Conveyance',
    'Medical Allowance', 'Other Allowance', 'TA Per Day',
  ];

  const sampleRow = [
    'KG0001', 'John Doe', 'KGGC VK', 'Chhattisgarh', 'Accounts', 'Executive',
    '2024-01-15', '4167015XXXXXX', 'Yes', '10XXXXXXXXXX',
    'No', 0,
    10000, 833, 0, 2000, 1600,
    500, 5067, 200,
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  XLSX.utils.book_append_sheet(wb, ws, 'Employee Master');
  XLSX.writeFile(wb, 'Employee_Master_Template.xlsx');
}

/**
 * Generate a sample attendance Excel template for download
 */
export function generateAttendanceTemplate(month: number, year: number): void {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const titleRow = [`Grader's Attendance Sheet ${monthNames[month - 1]}_${year}`];
  const preparedRow = [`Prepared on : ${new Date().toLocaleDateString('en-IN')}`];
  const picRow = ['PIC : '];
  const blankRow: string[] = [];

  const headers = [
    'S. No.', 'New Emp Code', 'Name', 'Location', 'Salary', 'Remarks', 'LWP',
    'No.of Working Days For TA', 'Travelling Cost per day',
    'Overtime Hours @ Hourly Wage', 'Overtime Hours @ Twice of Hourly Wages',
  ];

  const sampleRow = [
    1, 'KG0001', 'John Doe', 'KGGC VK', 20000, 'Full Salary', 0,
    16, 200, 0, 0,
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    titleRow, preparedRow, picRow, blankRow, headers, sampleRow,
  ]);

  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 15) }));

  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  XLSX.writeFile(wb, `Attendance_Template_${monthNames[month - 1]}_${year}.xlsx`);
}
