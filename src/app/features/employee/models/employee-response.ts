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
  department?: string;
  photoUrl?: string;
  mainBranchId?: string;
}
