export interface ApiProblemDetails {
  status: string;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
}
