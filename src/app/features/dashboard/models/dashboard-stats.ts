export interface WeeklyTrendItem {
  dateLabel: string;
  onTimeCount: number;
  lateCount: number;
}

export interface BranchAttendanceItem {
  branchId: string;
  branchName: string;
  checkInsCount: number;
}

export interface RecentActivityItem {
  attendanceId: string;
  employeeName: string;
  employeeCode: string;
  photoUrl: string | null;
  branchName: string;
  checkInTime: string;
  isLate: boolean;
  minutesLate: number;
}

export interface DashboardStatsResponse {
  totalActiveEmployees: number;
  todayCheckIns: number;
  todayLateCheckIns: number;
  todayOnBreak: number;
  todayEstimatedAbsences: number;
  weeklyTrend: WeeklyTrendItem[];
  branchBreakdown: BranchAttendanceItem[];
  recentActivities: RecentActivityItem[];
}
