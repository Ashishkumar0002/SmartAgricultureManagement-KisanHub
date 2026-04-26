import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NgIf,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = new FormBuilder();
  protected hidePassword = true;
  protected isSubmitting = false;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  protected submit() {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    console.debug('Login submit payload', {
      identifier: payload.email,
      hasPassword: !!payload.password,
    });

    this.isSubmitting = true;
    this.authService.login(payload).subscribe({
      next: () => {
        this.snackBar.open('Login successful', 'Close', { duration: 2500 });
        const role = this.authService.userRole();
        console.debug('Resolved role after login', role);
        if (role === 'farmer') {
          this.router.navigate(['/farmer/dashboard']);
        } else if (role === 'expert') {
          this.router.navigate(['/expert/dashboard']);
        } else if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        const detail = error?.error?.detail;
        const errorMessage = Array.isArray(detail)
          ? detail.map((item: { msg?: string }) => item?.msg).filter(Boolean).join(', ')
          : detail;

        let fallbackMessage = 'Login failed';
        if (error?.status === 401) {
          fallbackMessage = 'Invalid username, email, phone, or password';
        } else if (error?.status === 403) {
          fallbackMessage = 'Your account is not permitted to login yet';
        } else if (error?.status === 422) {
          fallbackMessage = 'Please provide both login identifier and password';
        }

        const message =
          error?.status === 0
            ? `Backend is unreachable. Ensure FastAPI is running and API is reachable at ${environment.apiUrl}`
            : errorMessage ?? fallbackMessage;

        console.error('Login failed in component', {
          status: error?.status,
          message,
        });
        this.snackBar.open(message, 'Close', { duration: 3500 });
        this.isSubmitting = false;
      },
    });
  }
}
