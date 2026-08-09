import { DocumentType } from './document-type';

export interface UpdateEmployeeRequest {
  code: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  hireDate: string; // ISO 8601 string
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  photoUrl?: string;
  mainBranchId?: string;
  requireFourPointAttendance?: boolean | null;
  mobileCheckInEnabled?: boolean;
  schedulePatterns?: import('./schedule-pattern').SchedulePatternDto[];
}
