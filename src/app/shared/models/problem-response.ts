export interface ProblemResponse {
  status: string;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
}
