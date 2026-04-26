import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, finalize, of } from 'rxjs';
import {
  WorkerAvailableJob,
  WorkerMyJob,
  WorkerProfile,
  WorkerProfilePayload,
  WorkerService,
} from '../../core/services/worker.service';

@Component({
  selector: 'app-workers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
      FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatSelectModule,
      MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="workers-section">
      <h2>Workers & Job Management</h2>

      <mat-tab-group>
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>work</mat-icon>
            <span>Apply for Job</span>
          </ng-template>

          <div class="tab-panel">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Location</mat-label>
                <input
                  matInput
                  [ngModel]="locationFilter()"
                  (ngModelChange)="locationFilter.set($event)"
                  placeholder="Filter by location"
                />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Skill</mat-label>
                <input
                  matInput
                  [ngModel]="skillFilter()"
                  (ngModelChange)="skillFilter.set($event)"
                  placeholder="Filter by skill"
                />
              </mat-form-field>

              <button mat-raised-button color="primary" type="button" (click)="loadApplyJobs()">
                <mat-icon>search</mat-icon>
                Search
              </button>
            </div>

            @if (isLoadingJobs()) {
              <div class="loading">Loading jobs...</div>
            } @else if (jobs().length > 0) {
              <table mat-table [dataSource]="jobs()" class="workers-table">
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Job Title</th>
                  <td mat-cell *matCellDef="let element">{{ element.title }}</td>
                </ng-container>

                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Description</th>
                  <td mat-cell *matCellDef="let element">{{ element.description }}</td>
                </ng-container>

                <ng-container matColumnDef="location">
                  <th mat-header-cell *matHeaderCellDef>Location</th>
                  <td mat-cell *matCellDef="let element">{{ element.location }}</td>
                </ng-container>

                <ng-container matColumnDef="wage">
                  <th mat-header-cell *matHeaderCellDef>Salary/Wage</th>
                  <td mat-cell *matCellDef="let element">₹{{ element.wage }}</td>
                </ng-container>

                <ng-container matColumnDef="farmer_name">
                  <th mat-header-cell *matHeaderCellDef>Farmer Name</th>
                  <td mat-cell *matCellDef="let element">{{ element.farmer_name || 'N/A' }}</td>
                </ng-container>

                <ng-container matColumnDef="posted_date">
                  <th mat-header-cell *matHeaderCellDef>Posted Date</th>
                  <td mat-cell *matCellDef="let element">{{ element.posted_date | date: 'mediumDate' }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let element">
                    <button
                      mat-raised-button
                      color="accent"
                      type="button"
                      (click)="applyForJob(element.id)"
                      [disabled]="appliedJobIds().has(element.id) || applyingJobId() === element.id"
                    >
                      {{ appliedJobIds().has(element.id) ? 'Applied' : (applyingJobId() === element.id ? 'Applying...' : 'Apply') }}
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="applyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: applyColumns"></tr>
              </table>
            } @else {
              <p class="no-data">No jobs found for the selected filters.</p>
            }
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>assignment</mat-icon>
            <span>My Jobs</span>
          </ng-template>

          <div class="tab-panel">
            @if (isLoadingMyJobs()) {
              <div class="loading">Loading your jobs...</div>
            } @else if (myJobs().length > 0) {
              <table mat-table [dataSource]="myJobs()" class="workers-table">
                <ng-container matColumnDef="job_title">
                  <th mat-header-cell *matHeaderCellDef>Job Title</th>
                  <td mat-cell *matCellDef="let item">{{ item.job_title }}</td>
                </ng-container>

                <ng-container matColumnDef="farmer_name">
                  <th mat-header-cell *matHeaderCellDef>Farmer Name</th>
                  <td mat-cell *matCellDef="let item">{{ item.farmer_name }}</td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let item">
                    <span [class]="'status-chip status-' + item.status">{{ getStatusLabel(item.status) }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="applied_at">
                  <th mat-header-cell *matHeaderCellDef>Applied Date</th>
                  <td mat-cell *matCellDef="let item">{{ item.applied_at | date: 'mediumDate' }}</td>
                </ng-container>

                <ng-container matColumnDef="started_at">
                  <th mat-header-cell *matHeaderCellDef>Started Date</th>
                  <td mat-cell *matCellDef="let item">{{ item.started_at ? (item.started_at | date: 'mediumDate') : 'N/A' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="myJobsColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: myJobsColumns"></tr>
              </table>
            } @else {
              <p class="no-data">You have not applied to any jobs yet.</p>
            }
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>person</mat-icon>
            <span>Worker Profile</span>
          </ng-template>

          <div class="tab-panel">
            @if (isLoadingProfile()) {
              <div class="loading">Loading worker profile...</div>
            } @else {
              <mat-card class="job-form-card">
                <mat-card-content>
                  <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                    <div class="profile-grid">
                      <mat-form-field appearance="outline">
                        <mat-label>Name</mat-label>
                        <input matInput formControlName="name" />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Contact Number</mat-label>
                        <input matInput formControlName="contact" />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Location</mat-label>
                        <input matInput formControlName="location" />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Skills</mat-label>
                        <input matInput formControlName="skills" />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Experience</mat-label>
                        <input matInput formControlName="experience" />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Availability Status</mat-label>
                        <mat-select formControlName="availability_status">
                          <mat-option value="available">Available</mat-option>
                          <mat-option value="working">Working</mat-option>
                          <mat-option value="looking_for_work">Looking for Work</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Profile Photo URL (Optional)</mat-label>
                        <input matInput formControlName="profile_image" />
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Bio / Description</mat-label>
                      <textarea matInput formControlName="bio" rows="4"></textarea>
                    </mat-form-field>

                    <div class="form-actions">
                      <button mat-raised-button color="primary" type="submit" [disabled]="isSavingProfile()">
                        {{ isSavingProfile() ? 'Saving...' : 'Update Profile' }}
                      </button>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </section>
  `,
  styles: [`
    .workers-section {
      padding: 24px;
    }

    h2 {
      color: #2e7d32;
      margin-bottom: 24px;
    }

    .filter-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      align-items: flex-end;
    }

    .tab-panel {
      padding-top: 8px;
    }

    .workers-table {
      width: 100%;
      background: white;
      margin-top: 16px;

      th {
        background: #f5f5f5;
        font-weight: 600;
        padding: 12px;
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
      }

    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 88px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .status-applied {
      background: #fff3cd;
      color: #8a6d00;
    }

    .status-accepted {
      background: #d9f3df;
      color: #1f6b2c;
    }

    .status-rejected {
      background: #f9d6d8;
      color: #8f1f2b;
    }

    .status-working {
      background: #d7ecff;
      color: #0b4f90;
    }

    .job-form-card {
      background: white;
      margin: 24px;

      .profile-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    }

    .no-data {
      color: #999;
      text-align: center;
      padding: 48px 24px;
      font-style: italic;
    }

    .loading {
      color: #999;
      text-align: center;
      padding: 24px;
    }

    @media (max-width: 768px) {
      .workers-section {
        padding: 16px;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .job-form-card {
        margin: 16px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkersComponent {
  protected readonly workerService = inject(WorkerService);
  protected readonly snackBar = inject(MatSnackBar);
  protected readonly fb = inject(FormBuilder);

  protected readonly jobs = signal<WorkerAvailableJob[]>([]);
  protected readonly myJobs = signal<WorkerMyJob[]>([]);
  protected readonly workerProfile = signal<WorkerProfile | null>(null);

  protected readonly isLoadingJobs = signal(false);
  protected readonly isLoadingMyJobs = signal(false);
  protected readonly isLoadingProfile = signal(false);
  protected readonly isSavingProfile = signal(false);
  protected readonly applyingJobId = signal<number | null>(null);

  protected readonly skillFilter = signal('');
  protected readonly locationFilter = signal('');

  protected readonly applyColumns = ['title', 'description', 'location', 'wage', 'farmer_name', 'posted_date', 'actions'];
  protected readonly myJobsColumns = ['job_title', 'farmer_name', 'status', 'applied_at', 'started_at'];

  protected readonly profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    contact: ['', [Validators.required, Validators.minLength(8)]],
    location: [''],
    skills: [''],
    experience: [''],
    availability_status: ['available' as WorkerProfile['availability_status'], Validators.required],
    profile_image: [''],
    bio: [''],
  });

  protected readonly appliedJobIds = computed(() => {
    const ids = new Set<number>();
    for (const item of this.myJobs()) {
      ids.add(item.job_id);
    }
    return ids;
  });

  constructor() {
    this.loadApplyJobs();
    this.loadMyJobs();
    this.loadProfile();
  }

  protected loadApplyJobs(): void {
    this.isLoadingJobs.set(true);

    const skill = this.skillFilter().trim() || undefined;
    const location = this.locationFilter().trim() || undefined;

    this.workerService
      .getAvailableJobs(location, skill)
      .pipe(
        catchError((error) => {
          this.snackBar.open(error?.error?.detail || 'Unable to load jobs', 'Close', { duration: 3000 });
          return of([] as WorkerAvailableJob[]);
        }),
        finalize(() => this.isLoadingJobs.set(false))
      )
      .subscribe((jobs) => this.jobs.set(jobs));
  }

  protected applyForJob(jobId: number): void {
    if (this.appliedJobIds().has(jobId)) {
      this.snackBar.open('You have already applied to this job.', 'Close', { duration: 2600 });
      return;
    }

    this.applyingJobId.set(jobId);
    this.workerService
      .applyForJob(jobId)
      .pipe(
        catchError((error) => {
          this.snackBar.open(error?.error?.detail || 'Unable to apply for this job', 'Close', { duration: 3200 });
          return of(null);
        }),
        finalize(() => this.applyingJobId.set(null))
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.snackBar.open('Application submitted successfully.', 'Close', { duration: 2200 });
        this.loadMyJobs();
      });
  }

  protected loadMyJobs(): void {
    this.isLoadingMyJobs.set(true);

    this.workerService
      .getMyJobs()
      .pipe(
        catchError((error) => {
          this.snackBar.open(error?.error?.detail || 'Unable to load your jobs', 'Close', { duration: 3000 });
          return of([] as WorkerMyJob[]);
        }),
        finalize(() => this.isLoadingMyJobs.set(false))
      )
      .subscribe((items) => this.myJobs.set(items));
  }

  protected loadProfile(): void {
    this.isLoadingProfile.set(true);

    this.workerService
      .getProfile()
      .pipe(
        catchError((error) => {
          this.snackBar.open(error?.error?.detail || 'Unable to load profile', 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => this.isLoadingProfile.set(false))
      )
      .subscribe((profile) => {
        if (!profile) {
          return;
        }

        this.workerProfile.set(profile);
        this.profileForm.patchValue({
          name: profile.name,
          contact: profile.contact,
          location: profile.location || '',
          skills: profile.skills || '',
          experience: profile.experience || '',
          availability_status: profile.availability_status,
          profile_image: profile.profile_image || '',
          bio: profile.bio || '',
        });
      });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();
    const payload: WorkerProfilePayload = {
      name: value.name?.trim() || '',
      contact: value.contact?.trim() || '',
      location: value.location?.trim() || null,
      skills: value.skills?.trim() || null,
      experience: value.experience?.trim() || null,
      availability_status: value.availability_status || 'available',
      profile_image: value.profile_image?.trim() || null,
      bio: value.bio?.trim() || null,
    };

    this.isSavingProfile.set(true);
    this.workerService
      .updateProfile(payload)
      .pipe(
        catchError((error) => {
          this.snackBar.open(error?.error?.detail || 'Unable to save profile', 'Close', { duration: 3200 });
          return of(null);
        }),
        finalize(() => this.isSavingProfile.set(false))
      )
      .subscribe((profile) => {
        if (!profile) {
          return;
        }

        this.workerProfile.set(profile);
        this.snackBar.open('Worker profile updated successfully.', 'Close', { duration: 2200 });
      });
  }

  protected getStatusLabel(status: WorkerMyJob['status']): string {
    if (status === 'applied') {
      return 'Applied';
    }
    if (status === 'accepted') {
      return 'Accepted';
    }
    if (status === 'rejected') {
      return 'Rejected';
    }
    return 'Working';
  }
}
