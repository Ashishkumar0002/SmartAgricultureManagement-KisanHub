import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { catchError, finalize, of } from 'rxjs';

import {
  WorkerAvailableJob,
  WorkerMyJob,
  WorkerProfile,
  WorkerProfilePayload,
  WorkerService,
} from '../../../core/services/worker.service';

@Component({
  selector: 'app-workers',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
  ],
  templateUrl: './workers.html',
  styleUrl: './workers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Workers {
  private readonly workerService = inject(WorkerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly jobs = signal<WorkerAvailableJob[]>([]);
  protected readonly myJobs = signal<WorkerMyJob[]>([]);
  protected readonly workerProfile = signal<WorkerProfile | null>(null);

  protected readonly isLoadingJobs = signal(false);
  protected readonly isLoadingMyJobs = signal(false);
  protected readonly isLoadingProfile = signal(false);
  protected readonly applyingJobId = signal<number | null>(null);
  protected readonly isSavingProfile = signal(false);

  protected readonly locationFilter = signal('');
  protected readonly skillFilter = signal('');

  protected readonly applyColumns = [
    'title',
    'description',
    'location',
    'wage',
    'farmer_name',
    'posted_date',
    'actions',
  ];
  protected readonly myJobsColumns = [
    'job_title',
    'farmer_name',
    'status',
    'applied_at',
    'started_at',
  ];

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
    this.workerService
      .getAvailableJobs(this.locationFilter().trim() || undefined, this.skillFilter().trim() || undefined)
      .pipe(
        catchError((error) => {
          this.snackBar.open(error?.error?.detail || 'Unable to load jobs', 'Close', { duration: 3000 });
          return of([] as WorkerAvailableJob[]);
        }),
        finalize(() => this.isLoadingJobs.set(false))
      )
      .subscribe((items) => this.jobs.set(items));
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

    this.isSavingProfile.set(true);
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
