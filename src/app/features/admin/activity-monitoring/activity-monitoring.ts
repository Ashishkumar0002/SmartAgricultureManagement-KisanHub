import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { catchError, of } from 'rxjs';

import { AdminService, ActivityLog } from '../../../core/services/admin.service';

@Component({
  selector: 'app-activity-monitoring',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    FormsModule,
  ],
  templateUrl: './activity-monitoring.html',
  styleUrl: './activity-monitoring.scss',
})
export class ActivityMonitoring {
  private readonly adminService = inject(AdminService);

  protected displayedColumns = ['timestamp', 'userId', 'action', 'entityType', 'description', 'ipAddress'];
  protected activities = signal<ActivityLog[]>([]);
  protected filteredActivities = signal<ActivityLog[]>([]);
  protected filterAction = 'all';
  protected filterDays = 7;
  protected filterLevel = 'all';
  protected pageSize = 20;
  protected pageIndex = 0;
  protected totalActivities = 0;

  constructor() {
    this.loadActivities();
  }

  protected loadActivities() {
    this.adminService
      .getLogs(this.filterLevel !== 'all' ? this.filterLevel : undefined, this.filterDays, 500)
      .pipe(
        catchError(() => {
          console.error('Failed to load activities');
          return of([]);
        })
      )
      .subscribe((activities) => {
        this.activities.set(activities);
        this.filterActivities();
      });
  }

  protected filterActivities() {
    let filtered = this.activities();

    if (this.filterAction !== 'all') {
      filtered = filtered.filter((a) => a.action === this.filterAction);
    }

    this.totalActivities = filtered.length;
    const startIdx = this.pageIndex * this.pageSize;
    this.filteredActivities.set(filtered.slice(startIdx, startIdx + this.pageSize));
  }

  protected onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterActivities();
  }

  protected onActionChange() {
    this.pageIndex = 0;
    this.filterActivities();
  }

  protected onDaysChange() {
    this.pageIndex = 0;
    this.loadActivities();
  }

  protected onLevelChange() {
    this.pageIndex = 0;
    this.loadActivities();
  }

  protected getActionIcon(action: string): string {
    switch (action) {
      case 'create':
        return 'add_circle';
      case 'update':
        return 'edit';
      case 'delete':
        return 'delete';
      case 'login':
        return 'login';
      case 'logout':
        return 'logout';
      default:
        return 'info';
    }
  }

  protected getActionColor(action: string): string {
    switch (action) {
      case 'create':
        return 'primary';
      case 'update':
        return 'accent';
      case 'delete':
        return 'warn';
      case 'login':
        return 'success';
      default:
        return 'basic';
    }
  }

  protected getEntityIcon(entityType: string): string {
    const icons: Record<string, string> = {
      user: 'person',
      content: 'description',
      equipment: 'agriculture',
      advisory: 'help',
      expert_assignment: 'assignment',
      activity_log: 'history',
    };
    return icons[entityType] || 'info';
  }

  protected getTruncatedDescription(description: string): string {
    return description.length > 50 ? description.substring(0, 50) + '...' : description;
  }
}
