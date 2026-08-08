export interface UpdateBranchRequest {
  code: string;
  name: string;
  address?: string;
  tardinessToleranceMinutes: number;
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadiusMeters?: number | null;
  requireFourPointAttendance: boolean;
  requirePhotoForMobile: boolean;
}
