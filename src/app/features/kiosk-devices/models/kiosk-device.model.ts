export interface KioskDeviceResponse {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthorizeDeviceRequest {
  name: string;
  branchId: string;
}

export interface AuthorizeDeviceResponse {
  token: string;
}
