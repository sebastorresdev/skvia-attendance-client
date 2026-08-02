export interface UserDetailResponse {
  id: string;
  displayName: string;
  userName: string;
  photoUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  branchIds: string[];
  roleIds: string[];
  isActive: boolean;
  createdAt: string;
  LastModifiedAt: string;
}
