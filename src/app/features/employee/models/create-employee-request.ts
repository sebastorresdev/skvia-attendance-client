import { DocumentType } from './document-type';

export interface CreateEmployeeRequest {
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
  mobileCheckInEnabled: boolean;
  applicationUserId?: string;
  requireFourPointAttendance: boolean;
  isAttendanceTracked: boolean;
  autoCompleteClockOut: boolean;
  allowedKioskIds?: string[];
}
