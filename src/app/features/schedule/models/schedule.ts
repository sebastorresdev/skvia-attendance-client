export interface ScheduleResponse {
  id: string;
  code: string;
  description: string;
  timeZoneId: string;
  hasBreak: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
  defaultStartTime: string;
  defaultEndTime: string;
}

export interface CreateScheduleRequest {
  code: string;
  description: string;
  timeZoneId: string;
  defaultStartTime: string;
  defaultEndTime: string;
  hasBreak: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
}

export interface UpdateScheduleRequest {
  code: string;
  description: string;
  timeZoneId: string;
  defaultStartTime: string;
  defaultEndTime: string;
  hasBreak: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
}

export enum ScheduleDayType {
  WorkDay = 0,
  DayOff = 1,
  Vacation = 2,
  MedicalLeave = 3,
  MakeUpDay = 4
}

export interface AssignBulkScheduleRequest {
  scheduleTemplateId: string;
  employeeIds: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface ScheduleMatrixCellItem {
  employeeId: string;
  date: string;
  dayType: ScheduleDayType;
  customScheduleId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface AssignScheduleMatrixRequest {
  cells: ScheduleMatrixCellItem[];
}

export interface CreateScheduleExceptionRequest {
  employeeId: string;
  date: string;
  dayType: ScheduleDayType;
  customScheduleId?: string | null;
  isDayOff?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface ResolvedScheduleDayDto {
  employeeId: string;
  date: string;
  dayType: ScheduleDayType;
  startTime: string | null;
  endTime: string | null;
  hasBreak: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
  scheduleId: string | null;
  scheduleCode: string | null;
  scheduleDescription: string | null;
  isException: boolean;
  exceptionId: string | null;
  exceptionReason: string | null;
}

export interface EmployeeScheduleGridRowDto {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string | null;
  branchName: string | null;
  days: ResolvedScheduleDayDto[];
}
