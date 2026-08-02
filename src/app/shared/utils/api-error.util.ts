// src/app/shared/utils/api-error.util.ts
import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblemDetails } from '../models/api-problem-details';

export function parseApiErrorMessage(err: unknown, defaultMessage = 'Ocurrió un error inesperado.'): string {
  if (!(err instanceof HttpErrorResponse) || !err.error) {
    return defaultMessage;
  }

  const problemDetails = err.error as ApiProblemDetails;

  // 1. Extrae el primer error de validación
  if (problemDetails.errors && Object.keys(problemDetails.errors).length > 0) {
    const firstKey = Object.keys(problemDetails.errors)[0];
    const messages = problemDetails.errors[firstKey];
    if (messages && messages.length > 0) {
      return messages[0];
    }
  }

  // 2. Extrae el detalle general
  if (problemDetails.detail) {
    return problemDetails.detail;
  }

  return defaultMessage;
}
