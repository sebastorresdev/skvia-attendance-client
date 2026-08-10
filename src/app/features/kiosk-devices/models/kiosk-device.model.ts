export interface KioskDeviceResponse {
  id: string;
  name: string;
  workplaceId: string;
  workplaceName: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthorizeDeviceRequest {
  name: string;
  workplaceId: string;
}

export interface AuthorizeDeviceResponse {
  token: string;
}
