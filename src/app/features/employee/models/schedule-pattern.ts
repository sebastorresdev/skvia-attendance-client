export interface SchedulePatternDto {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isWorkDay: boolean;
  startTime: string | null; // format: 'HH:mm:ss'
  endTime: string | null; // format: 'HH:mm:ss'
}
