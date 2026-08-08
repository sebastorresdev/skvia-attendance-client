export interface BranchResponse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  tardinessToleranceMinutes: number;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusMeters: number | null;
  requireFourPointAttendance: boolean;
  requirePhotoForMobile: boolean;
}
