import { DocumentType } from './document-type';

export interface EmployeeResponse {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  photoUrl?: string;
  mainBranchId?: string;
  mainBranchName?: string;
  status: EmployeeStatus;
  mobileCheckInEnabled: boolean;
  applicationUserId?: string;
  requireFourPointAttendance: boolean;
  isAttendanceTracked: boolean;
  autoCompleteClockOut: boolean;
  allowedKioskIds: string[];
}

export enum EmployeeStatus {
  Active = 1,
  Inactive = 2,
  Suspended = 3
}
