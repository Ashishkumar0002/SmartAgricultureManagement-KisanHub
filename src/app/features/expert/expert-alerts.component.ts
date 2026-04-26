import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { catchError, finalize, of } from 'rxjs';

import { ExpertService, Alert, AlertIn } from '../../core/services/expert.service';

@Component({
  selector: 'app-expert-alerts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="alerts-container">
      <div class="alerts-header">
        <h2>Alert Management System</h2>
        <p>Send weather, disease, and pest alerts to farmers</p>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Create New Alert -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>add_circle</mat-icon>
            <span>New Alert</span>
          </ng-template>

          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <h3>Create New Alert</h3>
              </mat-card-header>

              <mat-divider></mat-divider>

              <mat-card-content>
                <form [formGroup]="alertForm">
                  <!-- Alert Type -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Alert Type</mat-label>
                    <mat-select formControlName="alert_type">
                      <mat-option value="weather">Weather Change</mat-option>
                      <mat-option value="disease">Disease Outbreak</mat-option>
                      <mat-option value="pest">Pest Alert</mat-option>
                      <mat-option value="market">Market Update</mat-option>
                      <mat-option value="advisory">General Advisory</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Title -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Alert Title</mat-label>
                    <input
                      matInput
                      formControlName="title"
                      placeholder="e.g., Heavy Rainfall Warning"
                    />
                  </mat-form-field>

                  <!-- Description -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea
                      matInput
                      formControlName="description"
                      rows="4"
                      placeholder="Detailed description of the alert..."
                      maxlength="500"
                    ></textarea>
                    <mat-hint align="end">
                      {{ alertForm.get('description')?.value?.length || 0 }}/500
                    </mat-hint>
                  </mat-form-field>

                  <!-- Severity -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Severity Level</mat-label>
                    <mat-select formControlName="severity">
                      <mat-option value="low">Low</mat-option>
                      <mat-option value="medium">Medium</mat-option>
                      <mat-option value="high">High</mat-option>
                      <mat-option value="critical">Critical</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Target Regions -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Target Regions</mat-label>
                    <input
                      matInput
                      formControlName="target_regions"
                      placeholder="e.g., Maharashtra, Gujarat (comma-separated)"
                    />
                  </mat-form-field>

                  <!-- Affected Crops -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Affected Crops (optional)</mat-label>
                    <input
                      matInput
                      formControlName="affected_crops"
                      placeholder="e.g., Wheat, Rice (comma-separated)"
                    />
                  </mat-form-field>

                  <!-- Recommendations -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Recommendations</mat-label>
                    <textarea
                      matInput
                      formControlName="recommendations"
                      rows="3"
                      placeholder="Suggested actions for farmers..."
                      maxlength="500"
                    ></textarea>
                    <mat-hint align="end">
                      {{ alertForm.get('recommendations')?.value?.length || 0 }}/500
                    </mat-hint>
                  </mat-form-field>

                  <!-- Expiry Date -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Expiry Date (optional)</mat-label>
                    <input
                      matInput
                      type="date"
                      formControlName="expiry_date"
                    />
                  </mat-form-field>

                  <!-- Submit Button -->
                  <div class="button-group">
                    <button
                      mat-raised-button
                      color="accent"
                      (click)="createAlert()"
                      [disabled]="!alertForm.valid || isSubmitting()"
                    >
                      <mat-icon>send</mat-icon>
                      <span>{{ isSubmitting() ? 'Creating...' : 'Send Alert' }}</span>
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: Active Alerts -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>warning</mat-icon>
            <span>Active Alerts</span>
          </ng-template>

          <div class="tab-content">
            @if (isLoadingAlerts()) {
              <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (activeAlerts().length === 0) {
              <div class="empty-state">
                <mat-icon>info</mat-icon>
                <p>No active alerts</p>
              </div>
            } @else {
              <div class="alerts-grid">
                @for (alert of activeAlerts(); track alert.id) {
                  <mat-card class="alert-card" [ngClass]="'severity-' + alert.severity">
                    <mat-card-header>
                      <div class="alert-title">
                        <div class="alert-type-badge" [ngClass]="'type-' + alert.alert_type">
                          {{ alert.alert_type }}
                        </div>
                        <h3>{{ alert.title }}</h3>
                      </div>
                      <span class="alert-severity" [ngClass]="'level-' + alert.severity">
                        {{ alert.severity }}
                      </span>
                    </mat-card-header>

                    <mat-divider></mat-divider>

                    <mat-card-content>
                      <p class="alert-description">{{ alert.description }}</p>

                      @if (alert.affected_crops) {
                        <div class="alert-meta">
                          <strong>Affected Crops:</strong> {{ alert.affected_crops }}
                        </div>
                      }

                      <div class="alert-meta">
                        <strong>Regions:</strong> {{ alert.target_regions }}
                      </div>

                      @if (alert.recommendations) {
                        <div class="recommendations">
                          <strong>Recommendations:</strong>
                          <p>{{ alert.recommendations }}</p>
                        </div>
                      }

                      <div class="alert-footer">
                        <span class="alert-date">
                          <mat-icon>schedule</mat-icon>
                          {{ alert.created_at | date:'short' }}
                        </span>
                        @if (alert.expiry_date) {
                          <span class="alert-expiry">
                            <mat-icon>alarm</mat-icon>
                            Expires: {{ alert.expiry_date | date:'short' }}
                          </span>
                        }
                      </div>
                    </mat-card-content>

                    <mat-divider></mat-divider>

                    <mat-card-actions>
                      <button mat-button (click)="editAlert(alert)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                      <button mat-button color="warn" (click)="deactivateAlert(alert.id)">
                        <mat-icon>close</mat-icon>
                        Deactivate
                      </button>
                    </mat-card-actions>
                  </mat-card>
                }
              </div>
            }
          </div>
        </mat-tab>

        <!-- Tab 3: All Alerts History -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>history</mat-icon>
            <span>All Alerts</span>
          </ng-template>

          <div class="tab-content">
            @if (isLoadingAlerts()) {
              <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (allAlerts().length === 0) {
              <div class="empty-state">
                <mat-icon>info</mat-icon>
                <p>No alerts found</p>
              </div>
            } @else {
              <div class="alerts-timeline">
                @for (alert of allAlerts(); track alert.id) {
                  <div class="timeline-item" [ngClass]="alert.is_active ? 'active' : 'inactive'">
                    <div class="timeline-marker" [ngClass]="'severity-' + alert.severity"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <h4>{{ alert.title }}</h4>
                        <span class="timeline-type" [ngClass]="'type-' + alert.alert_type">
                          {{ alert.alert_type }}
                        </span>
                        @if (!alert.is_active) {
                          <span class="timeline-status">Inactive</span>
                        }
                      </div>
                      <p class="timeline-description">{{ alert.description }}</p>
                      <p class="timeline-date">{{ alert.created_at | date:'medium' }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .alerts-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .alerts-header {
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }

    .tab-content {
      padding: 24px;
    }

    .form-card {
      padding: 24px;

      mat-card-header {
        padding: 0;
        margin-bottom: 16px;

        h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 12px;

        button {
          flex: 1;
          min-width: 120px;
        }
      }
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: #999;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .alert-card {
      border-left: 4px solid;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }

      &.severity-critical {
        border-left-color: #D32F2F;
      }

      &.severity-high {
        border-left-color: #F57C00;
      }

      &.severity-medium {
        border-left-color: #FBC02D;
      }

      &.severity-low {
        border-left-color: #388E3C;
      }

      mat-card-header {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .alert-title {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex: 1;

        h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          flex: 1;
        }
      }

      .alert-type-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        white-space: nowrap;

        &.type-weather {
          background: #B3E5FC;
          color: #01579B;
        }

        &.type-disease {
          background: #F8BBD0;
          color: #880E4F;
        }

        &.type-pest {
          background: #FFCCBC;
          color: #BF360C;
        }

        &.type-market {
          background: #C8E6C9;
          color: #1B5E20;
        }

        &.type-advisory {
          background: #B2DFDB;
          color: #004D40;
        }
      }

      .alert-severity {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;

        &.level-critical {
          background: #FFCDD2;
          color: #C62828;
        }

        &.level-high {
          background: #FFE0B2;
          color: #E65100;
        }

        &.level-medium {
          background: #FFF9C4;
          color: #F57F17;
        }

        &.level-low {
          background: #C8E6C9;
          color: #1B5E20;
        }
      }

      mat-card-content {
        padding: 16px;
      }

      .alert-description {
        font-size: 13px;
        line-height: 1.6;
        color: #333;
        margin: 0 0 12px 0;
      }

      .alert-meta {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;

        strong {
          color: #1a1a1a;
        }
      }

      .recommendations {
        margin-top: 12px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 4px;

        strong {
          display: block;
          font-size: 12px;
          color: #1a1a1a;
          margin-bottom: 6px;
        }

        p {
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          margin: 0;
        }
      }

      .alert-footer {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: #999;
        margin-top: 12px;

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
      }

      mat-card-actions {
        padding: 12px 16px;
        display: flex;
        gap: 8px;
      }
    }

    .alerts-timeline {
      position: relative;
      padding: 20px 0 20px 40px;

      &::before {
        content: '';
        position: absolute;
        left: 10px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e0e0e0;
      }
    }

    .timeline-item {
      display: flex;
      margin-bottom: 24px;
      position: relative;

      &.inactive {
        opacity: 0.6;
      }
    }

    .timeline-marker {
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      left: -30px;
      top: 6px;

      &.severity-critical {
        background: #D32F2F;
      }

      &.severity-high {
        background: #F57C00;
      }

      &.severity-medium {
        background: #FBC02D;
      }

      &.severity-low {
        background: #388E3C;
      }
    }

    .timeline-content {
      flex: 1;
      padding: 12px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        flex: 1;
      }

      .timeline-type {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;

        &.type-weather {
          background: #B3E5FC;
          color: #01579B;
        }

        &.type-disease {
          background: #F8BBD0;
          color: #880E4F;
        }

        &.type-pest {
          background: #FFCCBC;
          color: #BF360C;
        }

        &.type-market {
          background: #C8E6C9;
          color: #1B5E20;
        }

        &.type-advisory {
          background: #B2DFDB;
          color: #004D40;
        }
      }

      .timeline-status {
        padding: 2px 8px;
        background: #f0f0f0;
        border-radius: 4px;
        font-size: 11px;
        color: #666;
      }
    }

    .timeline-description {
      font-size: 13px;
      line-height: 1.5;
      color: #333;
      margin: 0 0 6px 0;
    }

    .timeline-date {
      font-size: 11px;
      color: #999;
      margin: 0;
    }

    @media (max-width: 768px) {
      .alerts-grid {
        grid-template-columns: 1fr;
      }

      .form-card {
        padding: 16px;
      }

      .tab-content {
        padding: 16px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertAlertsComponent {
  private expertService = inject(ExpertService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  protected activeAlerts = signal<Alert[]>([]);
  protected allAlerts = signal<Alert[]>([]);
  protected isLoadingAlerts = signal(false);
  protected isSubmitting = signal(false);

  protected alertForm = this.fb.group({
    alert_type: ['weather', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    severity: ['medium', Validators.required],
    target_regions: ['', [Validators.required, Validators.minLength(3)]],
    affected_crops: [''],
    recommendations: [''],
    expiry_date: [''],
  });

  constructor() {
    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.isLoadingAlerts.set(true);

    this.expertService.getExpertAlerts(false)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error loading alerts', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe(alerts => {
        this.allAlerts.set(alerts);
        this.activeAlerts.set(alerts.filter(a => a.is_active));
        this.isLoadingAlerts.set(false);
      });
  }

  protected createAlert(): void {
    if (!this.alertForm.valid) {
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.alertForm.value;

    const alertData: AlertIn = {
      alert_type: (formValue.alert_type || '').trim(),
      title: (formValue.title || '').trim(),
      description: (formValue.description || '').trim(),
      severity: (formValue.severity || 'medium').trim(),
      target_regions: (formValue.target_regions || '').trim(),
      affected_crops: (formValue.affected_crops || '').trim() || undefined,
      recommendations: (formValue.recommendations || '').trim() || undefined,
      expiry_date: formValue.expiry_date ? new Date(`${formValue.expiry_date}T00:00:00`) : undefined,
    };

    this.expertService.createAlert(alertData)
      .pipe(
        catchError(error => {
          const detail = this.getApiErrorMessage(error);
          this.snackBar.open(detail, 'Close', { duration: 4500 });
          return of(null);
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe(alert => {
        if (alert) {
          this.snackBar.open('Alert sent successfully!', 'Close', { duration: 2000 });
          this.alertForm.reset({
            alert_type: 'weather',
            severity: 'medium',
            title: '',
            description: '',
            target_regions: '',
            affected_crops: '',
            recommendations: '',
            expiry_date: '',
          });
          this.loadAlerts();
        }
      });
  }

  private getApiErrorMessage(error: unknown): string {
    const defaultMessage = 'Error creating alert. Please try again.';
    if (!error || typeof error !== 'object') {
      return defaultMessage;
    }

    const payload = error as {
      status?: number;
      error?: { detail?: string | Array<{ msg?: string }> };
      message?: string;
    };

    const detail = payload.error?.detail;
    if (Array.isArray(detail)) {
      const joined = detail.map(item => item?.msg).filter(Boolean).join(', ');
      return joined || defaultMessage;
    }

    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }

    if (payload.status === 401) {
      return 'Session expired. Please login again.';
    }

    if (payload.status === 403) {
      return 'Only expert users can create alerts.';
    }

    if (payload.status === 404) {
      return 'Expert profile not found. Please complete expert registration first.';
    }

    return payload.message || defaultMessage;
  }

  protected editAlert(alert: Alert): void {
    this.alertForm.patchValue({
      alert_type: alert.alert_type,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      target_regions: alert.target_regions,
      affected_crops: alert.affected_crops,
      recommendations: alert.recommendations,
      expiry_date: alert.expiry_date ? new Date(alert.expiry_date).toISOString().split('T')[0] : '',
    });
  }

  protected deactivateAlert(alertId: number): void {
    if (!confirm('Are you sure you want to deactivate this alert?')) {
      return;
    }

    this.expertService.deactivateAlert(alertId)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error deactivating alert', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.snackBar.open('Alert deactivated', 'Close', { duration: 2000 });
          this.loadAlerts();
        }
      });
  }
}
