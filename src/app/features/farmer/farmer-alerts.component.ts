import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, interval, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FarmerAlert, FarmerService } from '../../core/services/farmer.service';

@Component({
  selector: 'app-farmer-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="alerts-section">
      <div class="alerts-header">
        <h2>Alerts</h2>
        <button mat-stroked-button color="primary" (click)="loadAlerts()" [disabled]="isLoading()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
        </div>
      } @else if (alerts().length === 0) {
        <div class="empty-state">
          <mat-icon>notifications_none</mat-icon>
          <p>No active alerts right now.</p>
        </div>
      } @else {
        <div class="alerts-grid">
          @for (alert of alerts(); track alert.id) {
            <mat-card class="alert-card" [class]="'severity-' + alert.severity">
              <mat-card-header>
                <mat-card-title>{{ alert.title }}</mat-card-title>
                <mat-card-subtitle>
                  {{ alert.alert_type | titlecase }} • {{ alert.created_at | date:'short' }}
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <p>{{ alert.description }}</p>
                <p><strong>Severity:</strong> {{ alert.severity | titlecase }}</p>
                <p><strong>Regions:</strong> {{ alert.target_regions }}</p>
                @if (alert.affected_crops) {
                  <p><strong>Affected Crops:</strong> {{ alert.affected_crops }}</p>
                }
                @if (alert.recommendations) {
                  <p><strong>Recommendations:</strong> {{ alert.recommendations }}</p>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .alerts-section {
      padding: 24px;
    }

    .alerts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .alert-card {
      border-left: 4px solid #9e9e9e;

      &.severity-critical {
        border-left-color: #c62828;
      }

      &.severity-high {
        border-left-color: #ef6c00;
      }

      &.severity-medium {
        border-left-color: #f9a825;
      }

      &.severity-low {
        border-left-color: #2e7d32;
      }

      p {
        margin: 8px 0;
        color: #3b4d3d;
      }
    }

    .loading-state,
    .empty-state {
      min-height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #8a968b;
      gap: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerAlertsComponent {
  private readonly farmerService = inject(FarmerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly alerts = signal<FarmerAlert[]>([]);
  protected readonly isLoading = signal(false);

  constructor() {
    this.loadAlerts();
    interval(20000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAlerts(true));
  }

  protected loadAlerts(silent = false): void {
    if (!silent) {
      this.isLoading.set(true);
    }

    this.farmerService.getFarmerAlerts(30)
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        this.alerts.set(rows);
        this.isLoading.set(false);
      });
  }
}
