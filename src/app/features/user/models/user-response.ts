export interface UserResponse {
  id: string;
  branchName: string;
  userName: string;
  photoUrl: string | null;
  email: string | null;
  roleNames: string[];
  isActive: boolean;
  lastModifiedAt: string;
}
