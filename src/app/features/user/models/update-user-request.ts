export interface UpdateUserRequest {
  userId: string;
  userName: string;
  email: string;
  isActive: boolean;
  displayName: string | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  branchIds: string[];
  roleIds: string[];
}
