import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { finalize } from 'rxjs';

import {
  AdminService,
  EmploymentApplication,
  EmploymentJob,
  EmploymentWorker,
} from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-employment',
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './employment.html',
  styleUrl: './employment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEmployment implements OnInit, AfterViewInit {
  private readonly adminService = inject(AdminService);

  @ViewChild('jobsPaginator') private jobsPaginator?: MatPaginator;
  @ViewChild('applicationsPaginator') private applicationsPaginator?: MatPaginator;
  @ViewChild('workersPaginator') private workersPaginator?: MatPaginator;

  protected readonly isLoadingJobs = signal(false);
  protected readonly isLoadingApplications = signal(false);
  protected readonly isLoadingWorkers = signal(false);

  protected readonly selectedJob = signal<EmploymentJob | null>(null);

  protected readonly displayedJobColumns = ['title', 'farmer', 'location', 'wage', 'status', 'actions'];
  protected readonly displayedApplicationColumns = ['applicant', 'job', 'farmer', 'email', 'message', 'status', 'created_at', 'actions'];
  protected readonly displayedWorkerColumns = ['name', 'contact', 'experience', 'status', 'actions'];

  protected readonly jobsDataSource = new MatTableDataSource<EmploymentJob>([]);
  protected readonly applicationsDataSource = new MatTableDataSource<EmploymentApplication>([]);
  protected readonly workersDataSource = new MatTableDataSource<EmploymentWorker>([]);

  ngOnInit(): void {
    this.loadJobs();
    this.loadApplications();
    this.loadWorkers();

    this.jobsDataSource.filterPredicate = (item, filter) =>
      [item.title, item.farmer_name, item.location, item.status].join(' ').toLowerCase().includes(filter);

    this.applicationsDataSource.filterPredicate = (item, filter) =>
      [item.applicant_name, item.job_title, item.farmer_name, item.applicant_email, item.status]
        .join(' ')
        .toLowerCase()
        .includes(filter);

    this.workersDataSource.filterPredicate = (item, filter) =>
      [item.name, item.contact, item.experience ?? '', item.is_blocked ? 'blocked' : 'active']
        .join(' ')
        .toLowerCase()
        .includes(filter);
  }

  ngAfterViewInit(): void {
    this.jobsDataSource.paginator = this.jobsPaginator ?? null;
    this.applicationsDataSource.paginator = this.applicationsPaginator ?? null;
    this.workersDataSource.paginator = this.workersPaginator ?? null;
  }

  protected applyJobsFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.jobsDataSource.filter = value;
    this.jobsDataSource.paginator?.firstPage();
  }

  protected applyApplicationsFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applicationsDataSource.filter = value;
    this.applicationsDataSource.paginator?.firstPage();
  }

  protected applyWorkersFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.workersDataSource.filter = value;
    this.workersDataSource.paginator?.firstPage();
  }

  protected viewJob(job: EmploymentJob): void {
    this.selectedJob.set(job);
  }

  protected blockWorker(worker: EmploymentWorker): void {
    if (worker.is_blocked) {
      return;
    }

    this.adminService.removeOrBlockWorker(worker.id, false).subscribe(() => {
      this.loadWorkers();
    });
  }

  protected updateApplicationStatus(application: EmploymentApplication, status: 'accepted' | 'rejected'): void {
    if (application.status === status) {
      return;
    }

    this.adminService.updateEmploymentApplicationStatus(application.id, status).subscribe(() => {
      this.loadApplications();
    });
  }

  private loadJobs(): void {
    this.isLoadingJobs.set(true);
    this.adminService
      .getEmploymentJobs()
      .pipe(finalize(() => this.isLoadingJobs.set(false)))
      .subscribe((jobs) => {
        this.jobsDataSource.data = jobs;
        if (this.selectedJob() && !jobs.find((job) => job.id === this.selectedJob()?.id)) {
          this.selectedJob.set(null);
        }
      });
  }

  private loadApplications(): void {
    this.isLoadingApplications.set(true);
    this.adminService
      .getEmploymentApplications()
      .pipe(finalize(() => this.isLoadingApplications.set(false)))
      .subscribe((applications) => {
        this.applicationsDataSource.data = applications;
      });
  }

  private loadWorkers(): void {
    this.isLoadingWorkers.set(true);
    this.adminService
      .getEmploymentWorkers()
      .pipe(finalize(() => this.isLoadingWorkers.set(false)))
      .subscribe((workers) => {
        this.workersDataSource.data = workers;
      });
  }
}
