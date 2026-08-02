export enum ScheduleDayType {
  WorkDay = 1,
  DayOff = 2,
  Vacation = 3,
  MedicalLeave = 4,
  MakeUpDay = 5,
}

export interface DailyScheduleRequest {
  date: string; // yyyy-MM-dd
  branchId: string;
  startTime?: string | null; // HH:mm:ss
  endTime?: string | null; // HH:mm:ss
  dayType: ScheduleDayType;
  baseScheduleId?: string | null;
}

export interface AssignWeeklyScheduleRequest {
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  days: DailyScheduleRequest[];
}

export interface EmployeeScheduleResponse {
  id: string;
  employeeId: string;
  date: string;
  branchId: string;
  branchName: string;
  assignedStartTime: string | null;
  assignedEndTime: string | null;
  dayType: ScheduleDayType;
  baseScheduleId: string | null;
  baseScheduleName: string | null;
}
