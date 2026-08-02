export interface ScheduleResponse {
  id: string;
  name: string;
  defaultStartTime: string;
  defaultEndTime: string;
}

export interface CreateScheduleRequest {
  name: string;
  defaultStartTime: string;
  defaultEndTime: string;
}

export interface UpdateScheduleRequest {
  name: string;
  defaultStartTime: string;
  defaultEndTime: string;
}
