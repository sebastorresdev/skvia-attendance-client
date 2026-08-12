export enum KioskDeviceStatus {
  Pending = 0,
  Linked = 1,
  Revoked = 2
}

export interface KioskDeviceResponse {
  id: string;
  name: string;
  workplaceId: string;
  workplaceName: string;
  status: KioskDeviceStatus;
  isActive: boolean;
  pairingCode?: string;
  pairingCodeExpiresAt?: string;
  linkedAt?: string;
  createdAt: string;
}

export interface AuthorizeDeviceRequest {
  name: string;
  workplaceId: string;
}

export interface AuthorizeDeviceResponse {
  deviceId: string;
  name: string;
  workplaceId: string;
  workplaceName: string;
  token: string;
  pairingCode: string;
  expiresAt: string;
}

export interface ClaimPairingCodeRequest {
  code: string;
}

export interface ClaimPairingCodeResponse {
  token: string;
  workplaceId: string;
  name: string;
  workplaceName?: string;
}
