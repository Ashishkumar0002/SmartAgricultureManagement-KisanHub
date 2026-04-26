import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, of } from 'rxjs';

import { AdminService, AdminUser } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-management',
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
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement {
  private readonly adminService = inject(AdminService);

  protected displayedColumns = ['id', 'username', 'fullName', 'email', 'role', 'status', 'actions'];
  protected users = signal<AdminUser[]>([]);
  protected filteredUsers = signal<AdminUser[]>([]);
  protected searchText = '';
  protected selectedRole = 'all';
  protected selectedStatus = 'all';
  protected selectedRegion = '';
  protected pageSize = 10;
  protected pageIndex = 0;
  protected totalUsers = 0;

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    const role = this.selectedRole !== 'all' ? this.selectedRole : undefined;
    const status = this.selectedStatus !== 'all' ? this.selectedStatus : undefined;
    const region = this.selectedRegion.trim() ? this.selectedRegion.trim() : undefined;

    this.adminService.getAllUsers({ role, status, region })
      .pipe(
        catchError(() => {
          console.error('Failed to load users');
          return of([]);
        })
      )
      .subscribe(users => {
        this.users.set(users);
        this.filterUsers();
      });
  }

  protected filterUsers() {
    let filtered = this.users();

    // Filter by role
    if (this.selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === this.selectedRole);
    }

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(u => (u.status ?? 'active') === this.selectedStatus);
    }

    // Filter by search text
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.username.toLowerCase().includes(searchLower) ||
          u.full_name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    this.totalUsers = filtered.length;
    const startIdx = this.pageIndex * this.pageSize;
    this.filteredUsers.set(filtered.slice(startIdx, startIdx + this.pageSize));
  }

  protected onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterUsers();
  }

  protected onSearchChange() {
    this.pageIndex = 0;
    this.filterUsers();
  }

  protected onRoleChange() {
    this.pageIndex = 0;
    this.loadUsers();
  }

  protected onStatusChange() {
    this.pageIndex = 0;
    this.loadUsers();
  }

  protected onRegionChange() {
    this.pageIndex = 0;
    this.loadUsers();
  }

  protected deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(userId)
        .pipe(
          catchError(() => {
            alert('Failed to delete user');
            return of(null);
          })
        )
        .subscribe(() => {
          this.loadUsers();
        });
    }
  }

  protected viewProfile(user: AdminUser) {
    console.log('View profile:', user);
    // Can be extended to show a modal with full profile details
  }

  protected updateUserStatus(user: AdminUser, status: 'active' | 'suspended') {
    this.adminService
      .updateUserStatus(user.id, status)
      .pipe(
        catchError(() => {
          alert('Failed to update user status');
          return of(null);
        })
      )
      .subscribe(result => {
        if (!result) {
          return;
        }
        this.loadUsers();
      });
  }
}
