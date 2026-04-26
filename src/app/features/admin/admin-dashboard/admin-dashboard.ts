import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, of } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { AuthService } from '../../../core/services/auth.service';
import { AdminService, DashboardStats, SystemHealth } from '../../../core/services/admin.service';
import { UserManagement } from '../user-management/user-management';
import { ContentManagement } from '../content-management/content-management';
import { EquipmentManagement } from '../equipment-management/equipment-management';
import { Analytics } from '../analytics/analytics';
import { ActivityMonitoring } from '../activity-monitoring/activity-monitoring';
import { AdminEmployment } from '../employment/employment';

interface AdminStatCard {
  title: string;
  value: number;
  icon: string;
}

interface AdminNavItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressBarModule,
    BaseChartDirective,
    UserManagement,
    ContentManagement,
    EquipmentManagement,
    AdminEmployment,
    Analytics,
    ActivityMonitoring,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly selectedTabStorageKey = 'sams_admin_dashboard_tab';

  protected readonly statCards = signal<AdminStatCard[]>([
    { title: 'Total Users', value: 0, icon: 'group' },
    { title: 'Active Farmers', value: 0, icon: 'agriculture' },
    { title: 'Alerts Sent', value: 0, icon: 'notifications' },
    { title: 'Equipment Bookings', value: 0, icon: 'build' },
  ]);

  // Chart configurations
  protected readonly userGrowthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
      },
    },
  };

  protected readonly userGrowthChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'User Growth',
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
    ],
  });

  protected readonly cropDistributionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  protected readonly cropDistributionChartData = signal<ChartData<'pie'>>({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
      },
    ],
  });

  protected readonly featureUsageChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
      },
    },
  };

  protected readonly featureUsageChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Feature Usage',
        backgroundColor: '#f97316',
      },
    ],
  });

  protected readonly navItems = signal<AdminNavItem[]>([
    { label: 'User Management', icon: 'group' },
    { label: 'Content Management', icon: 'description' },
    { label: 'Equipment', icon: 'agriculture' },
    { label: 'Employment', icon: 'badge' },
    { label: 'Analytics', icon: 'analytics' },
    { label: 'Activity Logs', icon: 'history' },
  ]);

  protected selectedTab = signal(this.restoreSelectedTab());
  protected currentUser = this.authService.currentUser;
  protected dashboardStats = signal<DashboardStats | null>(null);
  protected systemHealth = signal<SystemHealth | null>(null);
  protected dashboardError = signal<string>('');
  protected loadingOverview = signal(false);
  protected lastUpdatedAt = signal<string>('');

  // Activity timeline data
  protected readonly activities = signal<Array<{
    id: string;
    type: 'CREATE' | 'UPDATE' | 'ALERT';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
  }>>([
    {
      id: '1',
      type: 'CREATE',
      title: 'New Farmer Registration',
      description: 'Farmer John Doe registered with 5 acres of land',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      user: 'John Doe'
    },
    {
      id: '2',
      type: 'UPDATE',
      title: 'Crop Information Updated',
      description: 'Rice cultivation guide updated with new pest control methods',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: '3',
      type: 'ALERT',
      title: 'Weather Alert Sent',
      description: 'Heavy rainfall warning sent to 150 farmers in Punjab region',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    },
    {
      id: '4',
      type: 'CREATE',
      title: 'Equipment Booking',
      description: 'Tractor booking confirmed for Farmer Rajesh Kumar',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      user: 'Rajesh Kumar'
    },
    {
      id: '5',
      type: 'UPDATE',
      title: 'Expert Profile Updated',
      description: 'Dr. Priya Sharma updated her specialization in organic farming',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      user: 'Dr. Priya Sharma'
    }
  ]);

  constructor() {
    this.loadOverviewStats();
  }

  protected loadOverviewStats() {
    this.loadingOverview.set(true);
    this.dashboardError.set('');

    this.adminService
      .getDashboardStats()
      .pipe(catchError(() => of(null)))
      .subscribe((stats) => {
        if (!stats) {
          this.dashboardError.set('Failed to load dashboard stats. Check backend and refresh.');
          this.loadingOverview.set(false);
          return;
        }
        this.dashboardStats.set(stats);
        this.lastUpdatedAt.set(new Date().toISOString());
        this.statCards.set([
          { title: 'Total Users', value: stats.totalUsers, icon: 'group' },
          { title: 'Active Farmers', value: stats.totalFarmers, icon: 'agriculture' },
          { title: 'Alerts Sent', value: stats.featureUsageCounts?.alertsCount ?? 0, icon: 'notifications' },
          { title: 'Equipment Bookings', value: stats.featureUsageCounts?.equipmentBookingsCount ?? 0, icon: 'build' },
        ]);

        // Update charts
        this.updateCharts(stats);
        this.loadingOverview.set(false);
      });

    this.adminService
      .getSystemHealth()
      .pipe(catchError(() => of(null)))
      .subscribe((health) => {
        if (health) {
          this.systemHealth.set(health);
        }
      });
  }

  private updateCharts(stats: DashboardStats) {
    // User growth chart
    this.userGrowthChartData.set({
      labels: stats.userGrowthData.map(item => item.date),
      datasets: [
        {
          data: stats.userGrowthData.map(item => item.count),
          label: 'User Growth',
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
        },
      ],
    });

    // Crop distribution chart
    this.cropDistributionChartData.set({
      labels: stats.cropDistribution.map(item => item.name),
      datasets: [
        {
          data: stats.cropDistribution.map(item => item.count),
          backgroundColor: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
        },
      ],
    });

    // Feature usage chart
    this.featureUsageChartData.set({
      labels: stats.featureUsage.map(item => item.feature),
      datasets: [
        {
          data: stats.featureUsage.map(item => item.count),
          label: 'Feature Usage',
          backgroundColor: '#f97316',
        },
      ],
    });
  }

  protected logout() {
    this.authService.logout();
  }

  protected selectTab(index: number) {
    this.persistSelectedTab(index);
    this.selectedTab.set(index);
  }

  protected getTopFeatures() {
    return this.dashboardStats()?.featureUsage ?? [];
  }

  protected getTopCrops() {
    return this.dashboardStats()?.cropDistribution ?? [];
  }

  private restoreSelectedTab(): number {
    if (typeof window === 'undefined') {
      return 0;
    }

    const stored = window.localStorage.getItem(this.selectedTabStorageKey);
    const parsed = Number(stored);
    return Number.isInteger(parsed) && parsed >= 0 && parsed < this.navItems().length ? parsed : 0;
  }

  private persistSelectedTab(index: number): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.selectedTabStorageKey, String(index));
  }
}
