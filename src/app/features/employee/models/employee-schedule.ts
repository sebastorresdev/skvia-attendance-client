export enum ScheduleDayType {
  WorkDay = 1,
  DayOff = 2,
  MakeUpDay = 3,
  Vacation = 4,
  MedicalLeave = 5,
}

export interface DailyScheduleRequest {
  date: string; // yyyy-MM-dd
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
  assignedStartTime: string | null;
  assignedEndTime: string | null;
  dayType: ScheduleDayType;
  baseScheduleId: string | null;
  baseScheduleName: string | null;
}
