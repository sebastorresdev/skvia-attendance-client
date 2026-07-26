export interface UserDetailResponse {
  userId: string;
  displayName: string;
  userName: string;
  photoUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  branchIds: string[];
  roleIds: string[];
  isActive: boolean;
  CreateAt: string;
  LastModifiedAt: string;
}
