export interface BranchResponse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  tardinessToleranceMinutes: number;
}
