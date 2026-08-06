export enum JustificationType {
  Tardiness = 0,
  Absence = 1,
  EarlyLeave = 2
}

export enum JustificationStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}

export interface JustificationResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  branchName: string;
  date: string;
  type: JustificationType;
  reason: string;
  documentUrl: string | null;
  status: JustificationStatus;
  reviewerNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CreateJustificationRequest {
  employeeId: string;
  date: string;
  type: JustificationType;
  reason: string;
  documentUrl?: string;
}

export interface ReviewJustificationRequest {
  approve: boolean;
  notes?: string;
}
