import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('sams_token');

  if (!token) {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthError = error.status === 401;
      const detail =
        typeof error.error?.detail === 'string'
          ? error.error.detail.toLowerCase()
          : '';

      const hasInvalidTokenDetail =
        detail.includes('invalid token') ||
        detail.includes('invalid token payload') ||
        detail.includes('could not validate credentials') ||
        detail.includes('signature');

      if (isAuthError && hasInvalidTokenDetail) {
        localStorage.removeItem('sams_token');
        localStorage.removeItem('sams_user');

        if (!router.url.startsWith('/auth/login')) {
          router.navigate(['/auth/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
