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
import { FarmerRegistrationPayload } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-farmer-register',
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
  templateUrl: './farmer-register.html',
  styleUrl: './farmer-register.scss',
})
export class FarmerRegister {
  protected readonly soilTypes = ['Clay', 'Loam', 'Sandy', 'Silt', 'Black Soil', 'Red Soil'];
  protected readonly irrigationTypes = ['Drip', 'Flood', 'Sprinkler', 'Canal', 'Rain-fed'];
  protected readonly cropTypeOptions = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 'Oilseeds', 'Vegetables'];
  protected readonly incomeRanges = [
    'Below Rs 2 Lakh',
    'Rs 2 - 5 Lakh',
    'Rs 5 - 10 Lakh',
    'Rs 10 - 20 Lakh',
    'Above Rs 20 Lakh',
  ];

  protected profilePhoto: File | null = null;
  protected isSubmitting = false;

  protected readonly personalForm: FormGroup;
  protected readonly farmForm: FormGroup;
  protected readonly cropForm: FormGroup;
  protected readonly additionalForm: FormGroup;

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

    this.farmForm = this.fb.group({
      state: ['', Validators.required],
      district: ['', Validators.required],
      village: ['', Validators.required],
      total_land_acres: [null, [Validators.required, Validators.min(0.1)]],
      soil_type: ['', Validators.required],
      irrigation_type: ['', Validators.required],
      water_source: ['', Validators.required],
    });

    this.cropForm = this.fb.group({
      crop_types: [[], Validators.required],
      current_crops: ['', Validators.required],
      farming_experience_years: [0, [Validators.required, Validators.min(0)]],
    });

    this.additionalForm = this.fb.group({
      equipment_owned: [''],
      annual_income_range: [''],
    });
  }

  protected onProfilePhotoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    this.profilePhoto = file;
  }

  protected submit(): void {
    if (
      this.personalForm.invalid ||
      this.farmForm.invalid ||
      this.cropForm.invalid ||
      this.additionalForm.invalid ||
      this.isSubmitting
    ) {
      this.personalForm.markAllAsTouched();
      this.farmForm.markAllAsTouched();
      this.cropForm.markAllAsTouched();
      this.additionalForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const payload: FarmerRegistrationPayload = {
      full_name: this.personalForm.value.full_name,
      email: this.personalForm.value.email,
      phone: this.personalForm.value.phone,
      password: this.personalForm.value.password,
      state: this.farmForm.value.state,
      district: this.farmForm.value.district,
      village: this.farmForm.value.village,
      total_land_acres: Number(this.farmForm.value.total_land_acres),
      soil_type: this.farmForm.value.soil_type,
      irrigation_type: this.farmForm.value.irrigation_type,
      water_source: this.farmForm.value.water_source,
      crop_types: (this.cropForm.value.crop_types as string[]).join(', '),
      current_crops: this.cropForm.value.current_crops,
      farming_experience_years: Number(this.cropForm.value.farming_experience_years),
      equipment_owned: this.additionalForm.value.equipment_owned || undefined,
      annual_income_range: this.additionalForm.value.annual_income_range || undefined,
      profile_photo: this.profilePhoto,
    };

    this.authService.registerFarmer(payload).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Farmer registration successful', 'Close', { duration: 3000 });
        this.router.navigate(['/auth/login']);
        this.isSubmitting = false;
      },
      error: (error) => {
        this.snackBar.open(error?.error?.detail ?? 'Farmer registration failed', 'Close', { duration: 3500 });
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
