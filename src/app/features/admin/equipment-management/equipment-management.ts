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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { catchError, of } from 'rxjs';

import { AdminService, Equipment, EquipmentAnalytics } from '../../../core/services/admin.service';

@Component({
  selector: 'app-equipment-management',
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
    MatSlideToggleModule,
    MatBadgeModule,
    FormsModule,
  ],
  templateUrl: './equipment-management.html',
  styleUrl: './equipment-management.scss',
})
export class EquipmentManagement {
  private readonly adminService = inject(AdminService);

  protected displayedColumns = ['id', 'name', 'owner', 'location', 'dailyRent', 'availability', 'actions'];
  protected equipmentList = signal<Equipment[]>([]);
  protected filteredEquipment = signal<Equipment[]>([]);
  protected filterAvailability = signal<string>('all');
  protected pageSize = 10;
  protected pageIndex = 0;
  protected totalEquipment = 0;

  protected stats = signal({
    total: 0,
    available: 0,
    rented: 0,
  });
  protected equipmentAnalytics = signal<EquipmentAnalytics | null>(null);

  constructor() {
    this.loadEquipment();
  }

  private loadEquipment() {
    this.adminService.getEquipment()
      .pipe(
        catchError(() => {
          console.error('Failed to load equipment');
          return of([]);
        })
      )
      .subscribe(equipment => {
        this.equipmentList.set(equipment);
        this.updateStats();
        this.filterEquipment();
      });

    this.adminService
      .getEquipmentAnalytics()
      .pipe(catchError(() => of(null)))
      .subscribe((analytics) => {
        if (analytics) {
          this.equipmentAnalytics.set(analytics);
        }
      });
  }

  private updateStats() {
    const equipment = this.equipmentList();
    const stats = {
      total: equipment.length,
      available: equipment.filter(e => e.is_available).length,
      rented: equipment.filter(e => !e.is_available).length,
    };
    this.stats.set(stats);
  }

  protected filterEquipment() {
    let filtered = this.equipmentList();

    // Filter by availability
    if (this.filterAvailability() !== 'all') {
      const isAvailable = this.filterAvailability() === 'available';
      filtered = filtered.filter(e => e.is_available === isAvailable);
    }

    this.totalEquipment = filtered.length;
    const startIdx = this.pageIndex * this.pageSize;
    this.filteredEquipment.set(filtered.slice(startIdx, startIdx + this.pageSize));
  }

  protected onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterEquipment();
  }

  protected onFilterChange() {
    this.pageIndex = 0;
    this.filterEquipment();
  }

  protected getConditionColor(condition: string): string {
    switch (condition) {
      case 'good':
        return '#4caf50';
      case 'fair':
        return '#ff9800';
      case 'repair_needed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }
}
