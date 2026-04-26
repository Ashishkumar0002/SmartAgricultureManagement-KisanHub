import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

import { ExpertService, ExpertProfile, ExpertIn } from '../../core/services/expert.service';

@Component({
  selector: 'app-expert-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h2>My Profile</h2>
        <p>Manage your expert profile and specializations</p>
      </div>

      @if (isLoading()) {
        <div class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="profile-layout">
          <!-- Profile Summary Card -->
          <mat-card class="summary-card">
            <mat-card-header>
              <h3>Profile Summary</h3>
            </mat-card-header>

            <mat-divider></mat-divider>

            <mat-card-content>
              <div class="profile-avatar-section">
                <div class="avatar-placeholder">
                  @if (profile()?.profile_image) {
                    <img
                      class="profile-avatar-image"
                      [src]="getProfileImageUrl(profile()!.profile_image!)"
                      alt="Profile photo"
                    />
                  } @else {
                    <mat-icon>account_circle</mat-icon>
                  }
                </div>
                <div class="profile-info">
                  <div class="info-item">
                    <span class="label">Full Name</span>
                    <span class="value">{{ profile()?.full_name ?? 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Email</span>
                    <span class="value">{{ profile()?.email ?? 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <mat-divider class="section-divider"></mat-divider>

              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-icon" style="background: #FFC107;">
                    <mat-icon>star</mat-icon>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ profile()?.rating?.toFixed(1) ?? 0 }}</span>
                    <span class="stat-label">Rating</span>
                  </div>
                </div>

                <div class="stat-item">
                  <div class="stat-icon" style="background: #4CAF50;">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ profile()?.total_queries_resolved ?? 0 }}</span>
                    <span class="stat-label">Queries Resolved</span>
                  </div>
                </div>

                <div class="stat-item">
                  <div class="stat-icon" style="background: #2196F3;">
                    <mat-icon>timeline</mat-icon>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ profile()?.years_of_experience ?? 0 }}</span>
                    <span class="stat-label">Years Experience</span>
                  </div>
                </div>
              </div>

              <div class="profile-bio">
                <h4>About Me</h4>
                @if (profile()?.bio) {
                  <p>{{ profile()?.bio }}</p>
                } @else {
                  <p class="empty-text">No bio added yet</p>
                }
              </div>

              <div class="profile-specialization">
                <h4>Specialization</h4>
                @if (profile()?.specialization) {
                  <span class="specialization-badge">{{ profile()?.specialization }}</span>
                } @else {
                  <p class="empty-text">No specialization set</p>
                }
              </div>

              <div class="profile-contact">
                <h4>Contact</h4>
                @if (profile()?.phone) {
                  <div class="contact-item">
                    <mat-icon>phone</mat-icon>
                    <span>{{ profile()?.phone }}</span>
                  </div>
                } @else {
                  <p class="empty-text">No phone number provided</p>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Edit Profile Form -->
          <mat-card class="edit-card">
            <mat-card-header>
              <h3>Edit Profile</h3>
            </mat-card-header>

            <mat-divider></mat-divider>

            <mat-card-content>
              <form [formGroup]="profileForm">
                <div class="readonly-block">
                  <h4>Locked Identity Fields</h4>
                  <p><strong>Name:</strong> {{ profile()?.full_name || 'N/A' }}</p>
                  <p><strong>Email:</strong> {{ profile()?.email || 'N/A' }}</p>
                  <p><strong>Phone:</strong> {{ profile()?.phone || 'N/A' }}</p>
                </div>

                <div class="photo-upload-block">
                  <h4>Profile Photo</h4>
                  <p>Upload a clear photo (PNG, JPG, JPEG, WEBP)</p>
                  <input
                    #photoInput
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    (change)="onProfileImageSelected($event)"
                    [disabled]="isUploadingImage()"
                  />
                  <button
                    mat-stroked-button
                    type="button"
                    (click)="photoInput.click()"
                    [disabled]="isUploadingImage()"
                  >
                    <mat-icon>photo_camera</mat-icon>
                    <span>{{ isUploadingImage() ? 'Uploading...' : 'Choose Photo' }}</span>
                  </button>
                </div>

                <!-- Specialization -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Specialization</mat-label>
                  <input
                    matInput
                    formControlName="specialization"
                    placeholder="e.g., Organic Farming, Horticulture, Crop Protection"
                  />
                  @if (profileForm.get('specialization')?.getError('required')) {
                    <mat-error>Specialization is required</mat-error>
                  }
                  @if (profileForm.get('specialization')?.getError('minlength')) {
                    <mat-error>Must be at least 3 characters</mat-error>
                  }
                </mat-form-field>

                <!-- Bio -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Bio / About You</mat-label>
                  <textarea
                    matInput
                    formControlName="bio"
                    rows="5"
                    placeholder="Share your expertise, experience, and approach to helping farmers..."
                    maxlength="500"
                  ></textarea>
                  @if (profileForm.get('bio')?.getError('minlength')) {
                    <mat-error>Bio must be at least 20 characters</mat-error>
                  }
                  <mat-hint align="end">
                    {{ profileForm.get('bio')?.value?.length || 0 }}/500
                  </mat-hint>
                </mat-form-field>

                <!-- Achievements / Rewards -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Achievements / Rewards</mat-label>
                  <textarea
                    matInput
                    formControlName="achievements"
                    rows="3"
                    placeholder="Awards, recognitions, certifications, and key milestones"
                    maxlength="400"
                  ></textarea>
                  <mat-hint align="end">
                    {{ profileForm.get('achievements')?.value?.length || 0 }}/400
                  </mat-hint>
                </mat-form-field>

                <!-- Research Work -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Research Work</mat-label>
                  <textarea
                    matInput
                    formControlName="research_work"
                    rows="3"
                    placeholder="Research focus, publications, and field-study highlights"
                    maxlength="400"
                  ></textarea>
                  <mat-hint align="end">
                    {{ profileForm.get('research_work')?.value?.length || 0 }}/400
                  </mat-hint>
                </mat-form-field>

                <!-- Years of Experience -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Years of Experience</mat-label>
                  <input
                    matInput
                    formControlName="years_of_experience"
                    type="number"
                    min="0"
                    max="100"
                  />
                  @if (profileForm.get('years_of_experience')?.getError('min')) {
                    <mat-error>Years must be 0 or greater</mat-error>
                  }
                  @if (profileForm.get('years_of_experience')?.getError('max')) {
                    <mat-error>Please enter a valid number</mat-error>
                  }
                </mat-form-field>

                <!-- Form Actions -->
                <div class="button-group">
                  <button
                    mat-raised-button
                    color="accent"
                    (click)="updateProfile()"
                    [disabled]="!profileForm.valid || isSaving()"
                  >
                    <mat-icon>save</mat-icon>
                    <span>{{ isSaving() ? 'Saving...' : 'Save Changes' }}</span>
                  </button>
                  <button
                    mat-stroked-button
                    (click)="resetForm()"
                    [disabled]="isSaving()"
                  >
                    <mat-icon>refresh</mat-icon>
                    <span>Reset</span>
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-header {
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .profile-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .summary-card,
    .edit-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      mat-card-header {
        padding: 20px;
        display: flex;
        align-items: center;

        h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
      }

      mat-card-content {
        padding: 20px;
      }
    }

    .summary-card {
      .profile-avatar-section {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        margin-bottom: 20px;

        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2E7D32, #1B5E20);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: white;
          }

          .profile-avatar-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          }
        }

        .profile-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .label {
              font-size: 12px;
              color: #999;
              font-weight: 600;
              text-transform: uppercase;
            }

            .value {
              font-size: 16px;
              color: #1a1a1a;
              font-weight: 500;
            }
          }
        }
      }

      .section-divider {
        margin: 20px 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 20px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 6px;

          .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;

            mat-icon {
              font-size: 24px;
              width: 24px;
              height: 24px;
            }
          }

          .stat-content {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .stat-value {
              font-size: 18px;
              font-weight: 700;
              color: #1a1a1a;
            }

            .stat-label {
              font-size: 12px;
              color: #999;
            }
          }
        }
      }

      .profile-bio,
      .profile-specialization,
      .profile-contact {
        margin-bottom: 16px;

        h4 {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          color: #666;
          margin: 0 0 8px 0;
        }

        p {
          margin: 0;
          color: #333;
          font-size: 14px;
          line-height: 1.5;

          &.empty-text {
            color: #999;
            font-style: italic;
          }
        }

        .specialization-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #E8F5E9;
          color: #1B5E20;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #333;
          font-size: 14px;

          mat-icon {
            color: #2E7D32;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          &:not(:last-child) {
            margin-bottom: 8px;
          }
        }
      }
    }

    .edit-card {
      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .readonly-block {
        background: #f4f7f4;
        border: 1px solid #dce8dd;
        border-radius: 8px;
        padding: 12px;

        h4 {
          margin: 0 0 8px;
          font-size: 13px;
          color: #2f4932;
          text-transform: uppercase;
        }

        p {
          margin: 4px 0;
          color: #415744;
          font-size: 13px;
        }
      }

      .photo-upload-block {
        background: #f9faf9;
        border: 1px dashed #b6cbb8;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        h4 {
          margin: 0;
          font-size: 13px;
          text-transform: uppercase;
          color: #2f4932;
        }

        p {
          margin: 0;
          font-size: 12px;
          color: #556a58;
        }

        input[type='file'] {
          display: none;
        }

        button {
          width: fit-content;
        }
      }

      .full-width {
        width: 100%;
      }

      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 12px;

        button {
          flex: 1;
          min-width: 100px;
        }
      }
    }

    @media (max-width: 768px) {
      .profile-layout {
        grid-template-columns: 1fr;
      }

      .summary-card {
        .stats-grid {
          grid-template-columns: 1fr;
        }

        .profile-avatar-section {
          flex-direction: column;
          align-items: center;
          text-align: center;

          .avatar-placeholder {
            margin: 0 auto;
          }

          .profile-info {
            width: 100%;
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertProfileComponent {
  private expertService = inject(ExpertService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private readonly backendOrigin = this.resolveBackendOrigin();

  protected profile = signal<ExpertProfile | null>(null);
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected isUploadingImage = signal(false);

  protected profileForm = this.fb.group({
    specialization: ['', [Validators.required, Validators.minLength(3)]],
    bio: ['', [Validators.minLength(20)]],
    achievements: ['', [Validators.maxLength(400)]],
    research_work: ['', [Validators.maxLength(400)]],
    years_of_experience: [0, [Validators.min(0), Validators.max(100)]],
  });

  constructor() {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.isLoading.set(true);

    this.expertService.getExpertProfile()
      .pipe(
        catchError(error => {
          this.snackBar.open('Error loading profile', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(profile => {
        if (profile) {
          this.profile.set(profile);
          this.profileForm.patchValue({
            specialization: profile.specialization,
            bio: profile.bio,
            achievements: profile.achievements,
            research_work: profile.research_work,
            years_of_experience: profile.years_of_experience,
          });
        }
        this.isLoading.set(false);
      });
  }

  protected updateProfile(): void {
    if (!this.profileForm.valid) {
      this.snackBar.open('Please fix the errors in the form', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);
    const formValue = this.profileForm.value;

    const profileData: ExpertIn = {
      specialization: formValue.specialization || '',
      bio: formValue.bio || '',
      achievements: formValue.achievements || '',
      research_work: formValue.research_work || '',
      years_of_experience: formValue.years_of_experience || 0,
    };

    this.expertService.updateExpertProfile(profileData)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(updated => {
        if (updated) {
          this.snackBar.open('Profile updated successfully!', 'Close', { duration: 2000 });
          this.loadProfile();
        }
        this.isSaving.set(false);
      });
  }

  protected resetForm(): void {
    if (this.profile()) {
      this.profileForm.patchValue({
        specialization: this.profile()?.specialization,
        bio: this.profile()?.bio,
        achievements: this.profile()?.achievements,
        research_work: this.profile()?.research_work,
        years_of_experience: this.profile()?.years_of_experience,
      });
    }
  }

  protected onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.isUploadingImage.set(true);
    this.expertService.uploadProfileImage(file)
      .pipe(
        catchError(error => {
          const message = error?.error?.detail || 'Error uploading profile photo';
          this.snackBar.open(message, 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(result => {
        if (result && this.profile()) {
          this.profile.set({
            ...this.profile()!,
            profile_image: result.profile_image,
          });
          this.snackBar.open('Profile photo updated', 'Close', { duration: 2000 });
        }
        this.isUploadingImage.set(false);
        input.value = '';
      });
  }

  protected getProfileImageUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.backendOrigin}${normalizedPath}`;
  }

  private resolveBackendOrigin(): string {
    if (environment.apiUrl.startsWith('http://') || environment.apiUrl.startsWith('https://')) {
      const url = new URL(environment.apiUrl);
      return url.origin;
    }
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
}
