import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AdminUser,
  AuthResponse,
  AuthUser,
  ExpertRegistrationPayload,
  FarmerRegistrationPayload,
  LoginPayload,
  RegisterPayload,
  RegistrationResponse,
} from '../../shared/models/auth.model';
import { UserRole } from '../../shared/models/role.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  private readonly currentUserSignal = signal<AuthUser | null>(this.restoreUser());
  readonly currentUser = computed(() => this.currentUserSignal());

  login(payload: LoginPayload) {
    const loginUrl = `${this.baseUrl}/auth/login`;
    const identifier = payload.email.trim();
    const requestBody: LoginPayload = {
      email: identifier,
      username: identifier,
      phone: identifier,
      password: payload.password,
    };

    console.debug('Auth login request', {
      url: loginUrl,
      body: {
        email: requestBody.email,
        username: requestBody.username,
        phone: requestBody.phone,
      },
    });

    return this.http.post<AuthResponse>(loginUrl, requestBody).pipe(
      tap((response) => {
        console.debug('Auth login response success', {
          role: response.role,
          username: response.username,
          tokenType: response.token_type,
        });
        this.persistSession(response, identifier);
      }),
      catchError((error) => {
        console.error('Auth login response error', {
          status: error?.status,
          detail: error?.error?.detail,
          message: error?.message,
        });
        return throwError(() => error);
      })
    );
  }

  register(payload: RegisterPayload) {
    return this.http.post(`${this.baseUrl}/auth/register`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  registerFarmer(payload: FarmerRegistrationPayload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });

    return this.http.post<RegistrationResponse>(`${this.baseUrl}/register/farmer`, formData).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  registerExpert(payload: ExpertRegistrationPayload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });

    return this.http.post<RegistrationResponse>(`${this.baseUrl}/register/expert`, formData).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getUsers() {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/auth/users`);
  }

  logout() {
    localStorage.removeItem('sams_token');
    localStorage.removeItem('sams_user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated() {
    return !!localStorage.getItem('sams_token');
  }

  userRole(): UserRole | null {
    return this.currentUserSignal()?.role ?? null;
  }

  private persistSession(response: AuthResponse, username: string) {
    const tokenData = this.parseJwt(response.access_token);
    const tokenRole =
      tokenData?.['role'] ?? tokenData?.['user_role'] ?? tokenData?.['userType'] ?? tokenData?.['type'];
    const tokenUsername = tokenData?.['sub'] ?? tokenData?.['username'];
    const resolvedRole =
      response.role ??
      this.coerceRole(tokenRole) ??
      'farmer';

    const user: AuthUser = {
      username: response.username ?? (typeof tokenUsername === 'string' ? tokenUsername : username),
      role: resolvedRole,
    };

    localStorage.setItem('sams_token', response.access_token);
    localStorage.setItem('sams_user', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private parseJwt(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private coerceRole(value: unknown): UserRole | null {
    if (value === 'admin' || value === 'farmer' || value === 'expert') {
      return value;
    }
    return null;
  }

  private restoreUser(): AuthUser | null {
    const stored = localStorage.getItem('sams_user');
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  }
}
