import { HttpErrorResponse } from '@angular/common/http';

// the api's own message, plus each field's reason when validation fails
export function errorMessage(err: HttpErrorResponse) {
  if (err.status === 0) return "Can't reach the server. Check your connection and try again.";
  const details: string[] = err.error?.errors?.map((e: { message: string }) => e.message) ?? [];
  return [err.error?.message ?? 'Something went wrong. Please try again.', ...details].join(' ');
}
