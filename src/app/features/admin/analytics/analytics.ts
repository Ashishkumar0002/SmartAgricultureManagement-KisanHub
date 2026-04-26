import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';

import {
  AdminService,
  SystemAnalytics,
  AdminStats,
  AdvancedAnalytics,
  EquipmentAnalytics,
} from '../../../core/services/admin.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, BaseChartDirective],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics {
  private readonly adminService = inject(AdminService);

  // Expose Math to template
  protected Math = Math;

  protected systemAnalytics = signal<SystemAnalytics | null>(null);
  protected adminStats = signal<AdminStats | null>(null);
  protected advancedAnalytics = signal<AdvancedAnalytics | null>(null);
  protected equipmentAnalytics = signal<EquipmentAnalytics | null>(null);

  // Chart data
  protected userDistributionData: ChartConfiguration['data'] = {
    labels: ['Farmers', 'Experts', 'Admins'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#4ecdc4', '#45b7d1', '#ff6b6b'],
        borderColor: ['#4ecdc4', '#45b7d1', '#ff6b6b'],
      },
    ],
  };

  // System health chart options
  protected userDistributionOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Advisory status chart
  protected advisoryStatusData: ChartConfiguration['data'] = {
    labels: ['Active', 'Pending Assignment', 'Completed'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#ffc107', '#f44336', '#4caf50'],
        borderColor: ['#ffc107', '#f44336', '#4caf50'],
      },
    ],
  };

  protected advisoryStatusOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Equipment status chart
  protected equipmentStatusData: ChartConfiguration['data'] = {
    labels: ['Approved', 'Pending', 'Available', 'Rented'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#f44336'],
        borderColor: ['#4caf50', '#ff9800', '#2196f3', '#f44336'],
      },
    ],
  };

  protected equipmentStatusOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Response time chart
  protected responseTimeData: ChartConfiguration['data'] = {
    labels: ['Avg Response Time (Hours)'],
    datasets: [
      {
        label: 'Hours',
        data: [0],
        backgroundColor: '#45b7d1',
        borderColor: '#45b7d1',
      },
    ],
  };

  protected responseTimeOptions: ChartConfiguration['options'] = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  constructor() {
    this.loadAnalytics();
  }

  private loadAnalytics() {
    forkJoin({
      system: this.adminService.getSystemAnalytics().pipe(catchError(() => of(null))),
      stats: this.adminService.getAdminStats().pipe(catchError(() => of(null))),
      advanced: this.adminService.getAdvancedAnalytics().pipe(catchError(() => of(null))),
      equipmentAnalytics: this.adminService.getEquipmentAnalytics().pipe(catchError(() => of(null))),
    }).subscribe(({ system, stats, advanced, equipmentAnalytics }) => {
      if (system) {
        this.systemAnalytics.set(system);
      }
      if (stats) {
        this.adminStats.set(stats);
      }
      if (advanced) {
        this.advancedAnalytics.set(advanced);
      }
      if (equipmentAnalytics) {
        this.equipmentAnalytics.set(equipmentAnalytics);
      }

      if (system) {
        this.updateCharts(system, stats, equipmentAnalytics, advanced);
      }
    });
  }

  private updateCharts(
    system: SystemAnalytics,
    stats: AdminStats | null,
    equipmentAnalytics: EquipmentAnalytics | null,
    advanced: AdvancedAnalytics | null
  ) {
    // Update user distribution
    const totalUser = system.total_users;
    this.userDistributionData.datasets[0].data = [
      system.total_farmers,
      system.total_experts,
      totalUser - system.total_farmers - system.total_experts,
    ];

    // Update advisory status
    this.advisoryStatusData.datasets[0].data = [
      system.active_advisories,
      system.pending_advisories,
      system.total_advisories - system.active_advisories - system.pending_advisories,
    ];

    // Update equipment status
    if (equipmentAnalytics) {
      const available = Math.max(0, equipmentAnalytics.totalListings - equipmentAnalytics.activeBookings);
      this.equipmentStatusData.datasets[0].data = [
        equipmentAnalytics.totalListings,
        0,
        available,
        equipmentAnalytics.activeBookings,
      ];
    } else if (stats) {
      this.equipmentStatusData.datasets[0].data = [stats.approved_equipment, stats.pending_equipment, 0, 0];
    }

    // Update response time
    this.responseTimeData.labels = advanced ? ['DAU', 'MAU', 'Retention %'] : ['Avg Response Time (Hours)'];
    this.responseTimeData.datasets[0].label = advanced ? 'Advanced Analytics' : 'Hours';
    this.responseTimeData.datasets[0].data = advanced
      ? [advanced.dau, advanced.mau, advanced.retentionRate]
      : [system.avg_expert_response_time_hours];
  }

  protected getExpertResponseQuality(hours: number): string {
    if (hours <= 2) return 'Excellent';
    if (hours <= 5) return 'Good';
    if (hours <= 12) return 'Fair';
    return 'Needs Improvement';
  }

  protected getQualityColor(quality: string): string {
    switch (quality) {
      case 'Excellent':
        return '#4caf50';
      case 'Good':
        return '#2196f3';
      case 'Fair':
        return '#ff9800';
      default:
        return '#f44336';
    }
  }
}
