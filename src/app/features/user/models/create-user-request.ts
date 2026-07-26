export interface CreateUserRequest {
  displayName: string;
  userName: string;
  password: string;
  photoUrl: string | null;
  email: string | null;
  phoneNumber: string | null;
  roleIds: string[];
  branchIds: string[];
}
