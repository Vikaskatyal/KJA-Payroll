// Attendance data parsed from uploaded Excel

export interface AttendanceRecord {
  sNo: number;
  empCode: string;
  name: string;
  location: string;
  salary: number;
  remarks: string;
  lwpDays: number;
  workingDaysForTA: number;
  travellingCostPerDay: number;
  overtimeHoursRegular: number;
  overtimeHoursDouble: number;
}

export interface AttendanceSheet {
  month: number; // 1-12
  year: number;
  preparedOn: string;
  preparedBy: string;
  totalCalendarDays: number;
  records: AttendanceRecord[];
}
