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
