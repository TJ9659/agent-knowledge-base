import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('explains when the server cannot be reached', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain("Can't reach the server");
  });

  it("uses the api's message", () => {
    const err = new HttpErrorResponse({
      status: 409,
      error: { message: 'Email is already in use' },
    });
    expect(errorMessage(err)).toBe('Email is already in use');
  });

  it('adds each field reason when validation fails', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validation failed', errors: [{ path: 'name', message: 'Too short' }] },
    });
    expect(errorMessage(err)).toBe('Validation failed Too short');
  });

  it('falls back to a general message', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 500 }))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
