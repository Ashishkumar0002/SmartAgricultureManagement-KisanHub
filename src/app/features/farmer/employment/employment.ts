import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
  OnInit,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';

import { FarmerService, FarmerJobApplication, FarmerProfile, Job, Worker } from '../../../core/services/farmer.service';

@Component({
  selector: 'app-farmer-employment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  templateUrl: './employment.html',
  styleUrls: ['./employment.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerEmployment implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private farmerService = inject(FarmerService);

  // Paginators
  myJobsTablePaginator = viewChild(MatPaginator);
  applicationsTablePaginator = viewChild(MatPaginator);
  findWorkTablePaginator = viewChild(MatPaginator);

  // Loading states
  isLoadingMyJobs = signal(false);
  isLoadingMyApplications = signal(false);
  isLoadingFindWork = signal(false);
  isPostingJob = signal(false);
  isApplying = signal(false);

  // Data signals
  myJobs = signal<Job[]>([]);
  availableWorkers = signal<Worker[]>([]);
  myApplications = signal<FarmerJobApplication[]>([]);
  applyMessages = signal<Record<number, string>>({});
  farmerProfile = signal<FarmerProfile | null>(null);

  // Filter signals
  myJobsFilter = signal('');
  applicationsFilter = signal('');
  workerSkillFilter = signal('');
  workerLocationFilter = signal('');

  // Tab filters for my jobs
  jobStatusFilter = signal<'all' | 'open' | 'active' | 'closed'>('all');

  // Forms
  postJobForm!: FormGroup;
  filterForm!: FormGroup;

  // Data sources
  myJobsDataSource = new MatTableDataSource<Job>([]);
  applicationsDataSource = new MatTableDataSource<FarmerJobApplication>([]);
  findWorkDataSource = new MatTableDataSource<Worker>([]);

  // Table columns
  myJobsColumns = ['title', 'location', 'wage', 'duration', 'status', 'created_at', 'actions'];
  applicationsColumns = ['applicant_name', 'experience', 'skills', 'contact_number', 'location', 'job_title', 'status', 'created_at'];
  findWorkColumns = ['name', 'skills', 'experience', 'location', 'contact', 'availability_status', 'actions'];

  constructor() {
    // Initialize forms
    this.postJobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      location: ['', Validators.required],
      wage: ['', [Validators.required, Validators.min(1)]],
      duration: [''],
    });

    this.filterForm = this.fb.group({
      skill: [''],
      location: [''],
    });
  }

  ngOnInit(): void {
    this.loadFarmerContext();
  }

  ngAfterViewInit(): void {
    // Wire up paginators
    const myJobsPaginator = this.myJobsTablePaginator();
    if (myJobsPaginator) {
      this.myJobsDataSource.paginator = myJobsPaginator;
    }

    const applicationsPaginator = this.applicationsTablePaginator();
    if (applicationsPaginator) {
      this.applicationsDataSource.paginator = applicationsPaginator;
    }

    const findWorkPaginator = this.findWorkTablePaginator();
    if (findWorkPaginator) {
      this.findWorkDataSource.paginator = findWorkPaginator;
    }
  }

  // ==================== MY JOBS ====================

  private loadFarmerContext(): void {
    this.farmerService.getFarmerProfile().subscribe({
      next: (profile) => {
        this.farmerProfile.set(profile);
        this.loadMyJobs();
        this.loadMyApplications();
        this.loadAvailableWorkers();
      },
      error: () => {
        this.loadMyJobs();
        this.loadMyApplications();
        this.loadAvailableWorkers();
      },
    });
  }

  loadMyJobs(): void {
    this.isLoadingMyJobs.set(true);
    const status = this.jobStatusFilter() === 'all' ? undefined : this.jobStatusFilter();
    const farmerId = this.farmerProfile()?.id;
    this.farmerService
      .getMyJobs(farmerId, status)
      .pipe(finalize(() => this.isLoadingMyJobs.set(false)))
      .subscribe({
        next: (jobs) => {
          this.myJobs.set(jobs);
          this.myJobsDataSource.data = jobs;
        },
        error: (err) => console.error('Error loading my jobs:', err),
      });
  }

  filterMyJobs(): void {
    const filterValue = this.myJobsFilter().toLowerCase();
    this.myJobsDataSource.filterPredicate = (data: Job, filter: string) => {
      return (
        data.title.toLowerCase().includes(filter) ||
        data.location.toLowerCase().includes(filter) ||
        data.status.toLowerCase().includes(filter)
      );
    };
    this.myJobsDataSource.filter = filterValue;
  }

  onJobStatusFilterChange(status: 'all' | 'open' | 'active' | 'closed'): void {
    this.jobStatusFilter.set(status);
    this.loadMyJobs();
  }

  deleteJob(jobId: number): void {
    if (!confirm('Are you sure you want to delete this job?')) return;

    this.farmerService.deleteJob(jobId).subscribe({
      next: () => {
        this.loadMyJobs();
      },
      error: (err) => console.error('Error deleting job:', err),
    });
  }

  editJob(job: Job): void {
    // For now, we'll just populate the form with the job data
    // In a real app, you'd open a dialog or navigate to an edit page
    this.postJobForm.patchValue({
      title: job.title,
      description: job.description,
      location: job.location,
      wage: job.wage,
      duration: job.duration || '',
    });
  }

  // ==================== POST JOB ====================

  submitJob(): void {
    if (!this.postJobForm.valid) {
      alert('Please fill in all required fields');
      return;
    }

    this.isPostingJob.set(true);
    this.farmerService
      .createJob(this.postJobForm.value as any)
      .pipe(finalize(() => this.isPostingJob.set(false)))
      .subscribe({
        next: () => {
          alert('Job Posted Successfully');
          this.postJobForm.reset();
          this.loadMyJobs();
          this.loadAvailableWorkers();
        },
        error: (err) => {
          console.error('Error posting job:', err);
          alert('Error posting job. Please try again.');
        },
      });
  }

  resetJobForm(): void {
    this.postJobForm.reset();
  }

  // ==================== APPLICANTS ====================

  loadMyApplications(): void {
    this.isLoadingMyApplications.set(true);
    const farmerId = this.farmerProfile()?.id;
    this.farmerService
      .getFarmerJobApplications(farmerId)
      .pipe(finalize(() => this.isLoadingMyApplications.set(false)))
      .subscribe({
        next: (applications) => {
          this.myApplications.set(applications);
          this.applicationsDataSource.data = applications;
        },
        error: (err) => console.error('Error loading my applications:', err),
      });
  }

  filterApplications(): void {
    const filterValue = this.applicationsFilter().toLowerCase();
    this.applicationsDataSource.filterPredicate = (data: FarmerJobApplication, filter: string) => {
      return (
        (data.applicant_name?.toLowerCase() || '').includes(filter) ||
        (data.experience?.toLowerCase() || '').includes(filter) ||
        (data.skills?.toLowerCase() || '').includes(filter) ||
        (data.contact_number?.toLowerCase() || '').includes(filter) ||
        (data.location?.toLowerCase() || '').includes(filter) ||
        (data.job_title?.toLowerCase() || '').includes(filter) ||
        (data.status.toLowerCase() || '').includes(filter)
      );
    };
    this.applicationsDataSource.filter = filterValue;
  }

  // ==================== AVAILABLE WORKERS ====================

  loadAvailableWorkers(): void {
    this.isLoadingFindWork.set(true);
    const skill = this.filterForm.get('skill')?.value?.trim() || undefined;
    const location = this.filterForm.get('location')?.value?.trim() || undefined;
    this.farmerService
      .getAvailableWorkers(skill, location)
      .pipe(finalize(() => this.isLoadingFindWork.set(false)))
      .subscribe({
        next: (workers) => {
          this.availableWorkers.set(workers);
          this.findWorkDataSource.data = workers;
        },
        error: (err) => console.error('Error loading available workers:', err),
      });
  }

  filterFindWork(): void {
    this.loadAvailableWorkers();
  }

  contactWorker(worker: Worker): void {
    if (worker.contact) {
      window.open(`tel:${worker.contact}`, '_self');
      return;
    }

    alert('No contact number available for this worker.');
  }

  // Helper methods
  getStatusBadgeClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getJobVisibilityLabel(status: string): string {
    return status === 'rejected' || status === 'closed' ? 'Closed' : 'Open';
  }

  getWorkerAvailabilityLabel(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized === 'available') {
      return 'Available';
    }
    if (normalized === 'looking_for_work') {
      return 'Looking for Work';
    }
    return 'Busy';
  }

  setApplyMessage(jobId: number, value: string): void {
    this.applyMessages.update((state) => ({
      ...state,
      [jobId]: value,
    }));
  }

  getApplyMessage(jobId: number): string {
    return this.applyMessages()[jobId] ?? '';
  }

  getAppliedStatus(jobId: number): string | null {
    const applied = this.myApplications().find((app) => app.job_id === jobId);
    return applied ? applied.status : null;
  }
}
