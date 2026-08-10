// src/app/shared/utils/api-error.util.ts
import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblemDetails } from '../models/api-problem-details';

export function parseApiErrorMessage(err: any, defaultMessage = 'Ocurrió un error inesperado.'): string {
  const errorObj = err?.error || err;

  // 1. Extrae el primer error de validación
  if (errorObj?.errors && typeof errorObj.errors === 'object' && Object.keys(errorObj.errors).length > 0) {
    const firstKey = Object.keys(errorObj.errors)[0];
    const messages = errorObj.errors[firstKey];
    if (Array.isArray(messages) && messages.length > 0) {
      return messages[0];
    }
  }

  // 2. Extrae el detalle general
  if (errorObj?.detail) {
    return errorObj.detail;
  }
  
  if (err?.message) {
      return err.message;
  }

  return defaultMessage;
}
