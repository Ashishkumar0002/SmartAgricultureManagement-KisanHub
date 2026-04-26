import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/services/auth.service';
import { ExpertRegistrationPayload } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-expert-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <mat-card class="register-card page-card">
      <h2>Expert Registration</h2>

      <mat-stepper [linear]="true">
        <mat-step [stepControl]="personalForm" label="Personal Details">
          <form [formGroup]="personalForm" class="step-form">
            <mat-form-field appearance="outline"><mat-label>Full Name</mat-label><input matInput formControlName="full_name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Phone Number</mat-label><input matInput formControlName="phone" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" formControlName="confirm_password" />
              @if (personalForm.hasError('passwordMismatch') && personalForm.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            <div class="file-input">
              <label>Profile Photo</label>
              <input type="file" accept="image/*" (change)="onProfilePhotoSelected($event)" />
            </div>

            <div class="step-actions">
              <button mat-flat-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="professionalForm" label="Professional Details">
          <form [formGroup]="professionalForm" class="step-form">
            <mat-form-field appearance="outline">
              <mat-label>Qualification</mat-label>
              <mat-select formControlName="qualification">
                @for (q of qualifications; track q) {
                  <mat-option [value]="q">{{ q }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Specialization</mat-label>
              <mat-select formControlName="specialization">
                @for (s of specializations; track s) {
                  <mat-option [value]="s">{{ s }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline"><mat-label>Years of Experience</mat-label><input matInput type="number" formControlName="years_of_experience" /></mat-form-field>
            <mat-form-field appearance="outline" class="full-row"><mat-label>Short Bio</mat-label><textarea matInput rows="3" formControlName="bio"></textarea></mat-form-field>

            <div class="file-input full-row">
              <label>Certifications (Optional)</label>
              <input type="file" (change)="onCertificationsSelected($event)" />
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>Back</button>
              <button mat-flat-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="workForm" label="Work & Verification">
          <form [formGroup]="workForm" class="step-form">
            <mat-form-field appearance="outline"><mat-label>Working Organization (Optional)</mat-label><input matInput formControlName="working_organization" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Service Areas</mat-label><input matInput formControlName="service_areas" placeholder="State/District list" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Languages Known</mat-label><input matInput formControlName="languages_known" placeholder="English, Hindi, Punjabi" /></mat-form-field>

            <div class="file-input full-row">
              <label>ID Proof Upload (Required)</label>
              <input type="file" (change)="onIdProofSelected($event)" />
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious>Back</button>
              <button mat-flat-button color="primary" type="button" (click)="submit()" [disabled]="isSubmitting">
                @if (isSubmitting) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>verified</mat-icon>
                }
                Complete Registration
              </button>
            </div>
          </form>
        </mat-step>
      </mat-stepper>

      <p class="switch">Already have an account? <a routerLink="/auth/login">Login</a></p>
    </mat-card>
  `,
  styles: [`
    .register-card {
      width: min(100%, 980px);
      padding: 24px;
      border-radius: 18px;
    }

    .step-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .full-row {
      grid-column: 1 / -1;
    }

    .file-input {
      display: grid;
      gap: 6px;
    }

    .step-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }

    .switch {
      margin-top: 14px;
    }

    a {
      color: #1b5e20;
      font-weight: 600;
    }

    @media (max-width: 800px) {
      .step-form {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ExpertRegister {
  protected readonly qualifications = ['BSc Agriculture', 'MSc Agriculture', 'PhD', 'Diploma', 'Other'];
  protected readonly specializations = ['Crop', 'Soil', 'Pest Control', 'Irrigation', 'Plant Pathology', 'Agri Economics'];

  protected profilePhoto: File | null = null;
  protected certificationsFile: File | null = null;
  protected idProofFile: File | null = null;
  protected isSubmitting = false;

  protected readonly personalForm: FormGroup;
  protected readonly professionalForm: FormGroup;
  protected readonly workForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {
    this.personalForm = this.fb.group(
      {
        full_name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.minLength(10)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );

    this.professionalForm = this.fb.group({
      qualification: ['', Validators.required],
      specialization: ['', Validators.required],
      years_of_experience: [0, [Validators.required, Validators.min(0)]],
      bio: [''],
    });

    this.workForm = this.fb.group({
      working_organization: [''],
      service_areas: ['', Validators.required],
      languages_known: ['', Validators.required],
    });
  }

  protected onProfilePhotoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.profilePhoto = target.files?.[0] ?? null;
  }

  protected onCertificationsSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.certificationsFile = target.files?.[0] ?? null;
  }

  protected onIdProofSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.idProofFile = target.files?.[0] ?? null;
  }

  protected submit(): void {
    if (this.personalForm.invalid || this.professionalForm.invalid || this.workForm.invalid || !this.idProofFile || this.isSubmitting) {
      this.personalForm.markAllAsTouched();
      this.professionalForm.markAllAsTouched();
      this.workForm.markAllAsTouched();
      if (!this.idProofFile) {
        this.snackBar.open('ID proof is required for verification', 'Close', { duration: 3000 });
      }
      return;
    }

    this.isSubmitting = true;

    const payload: ExpertRegistrationPayload = {
      full_name: this.personalForm.value.full_name,
      email: this.personalForm.value.email,
      phone: this.personalForm.value.phone,
      password: this.personalForm.value.password,
      qualification: this.professionalForm.value.qualification,
      specialization: this.professionalForm.value.specialization,
      years_of_experience: Number(this.professionalForm.value.years_of_experience),
      bio: this.professionalForm.value.bio || undefined,
      working_organization: this.workForm.value.working_organization || undefined,
      service_areas: this.workForm.value.service_areas,
      languages_known: this.workForm.value.languages_known,
      profile_photo: this.profilePhoto,
      certifications_file: this.certificationsFile,
      id_proof_file: this.idProofFile,
    };

    this.authService.registerExpert(payload).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Expert registration submitted', 'Close', { duration: 3500 });
        this.router.navigate(['/auth/login']);
        this.isSubmitting = false;
      },
      error: (error) => {
        this.snackBar.open(error?.error?.detail ?? 'Expert registration failed', 'Close', { duration: 3500 });
        this.isSubmitting = false;
      },
    });
  }

  private passwordMatchValidator(form: FormGroup): null | object {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirm_password')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
