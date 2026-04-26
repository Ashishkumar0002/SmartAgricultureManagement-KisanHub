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
import { catchError, forkJoin, of } from 'rxjs';

import { AdminService, ExpertAssignment } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUser } from '../../../shared/models/auth.model';

interface AdvisoryRequest {
  id: number;
  question: string;
  farmer_id: number;
  expert_id: number | null;
  created_at: string;
  assigned?: ExpertAssignment;
}

@Component({
  selector: 'app-expert-assignment',
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
  templateUrl: './expert-assignment.html',
  styleUrl: './expert-assignment.scss',
})
export class ExpertAssignmentComponent {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  protected displayedColumns = ['id', 'question', 'farmerEmail', 'expertEmail', 'status', 'assignedDate', 'actions'];
  protected assignments = signal<ExpertAssignment[]>([]);
  protected filteredAssignments = signal<ExpertAssignment[]>([]);
  protected experts = signal<AdminUser[]>([]);
  protected selectedStatus = signal<string>('all');
  protected selectedExpertId = signal<number | null>(null);
  protected pageSize = 10;
  protected pageIndex = 0;
  protected totalAssignments = 0;

  constructor() {
    this.loadData();
  }

  private loadData() {
    forkJoin({
      assignments: this.adminService.getExpertAssignments().pipe(catchError(() => of([]))),
      experts: this.authService.getUsers().pipe(
        catchError(() => of([]))
      ),
    }).subscribe(({ assignments, experts }) => {
      const expertUsers = experts.filter((u: any) => u.role === 'expert');
      this.experts.set(expertUsers);
      this.assignments.set(assignments);
      this.filterAssignments();
    });
  }

  protected filterAssignments() {
    let filtered = this.assignments();

    // Filter by status
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(a => a.status === this.selectedStatus());
    }

    this.totalAssignments = filtered.length;
    const startIdx = this.pageIndex * this.pageSize;
    this.filteredAssignments.set(filtered.slice(startIdx, startIdx + this.pageSize));
  }

  protected onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterAssignments();
  }

  protected markAsCompleted(assignmentId: number) {
    if (confirm('Mark this assignment as completed?')) {
      this.adminService.updateExpertAssignment(assignmentId, 'completed')
        .pipe(catchError(() => {
          alert('Failed to update assignment');
          return of(null);
        }))
        .subscribe(result => {
          if (result) {
            this.loadData();
          }
        });
    }
  }

  protected getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'assigned':
        return 'status-assigned';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  }
}
