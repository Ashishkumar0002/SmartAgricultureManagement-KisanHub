import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  AIAdvisorResponse,
  AIImageAnalysisResponse,
  FarmerAlert,
  FarmerProfile,
  FarmerService,
} from '../../core/services/farmer.service';

@Component({
  selector: 'app-farm-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="farm-profile">
      <div class="page-header">
        <div>
          <h2>My Farm Profile</h2>
          <p>Manage soil intelligence, crop planning, farm analytics, assets, imagery, and alerts in one place.</p>
        </div>
        <button mat-stroked-button color="primary" type="button" (click)="reloadProfile()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="42"></mat-spinner>
        </div>
      }

      <form [formGroup]="profileForm" (ngSubmit)="submitProfile()">
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-card-title>Farm Details</mat-card-title>
            <mat-card-subtitle>Update the core profile used across the dashboard</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" required />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Location</mat-label>
                <input matInput formControlName="location" required />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Total Land (hectares)</mat-label>
                <input matInput type="number" formControlName="total_land" min="0.1" required />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Soil Type</mat-label>
                <mat-select formControlName="soil_type">
                  <mat-option value="">Select Soil Type</mat-option>
                  <mat-option value="clay">Clay</mat-option>
                  <mat-option value="loam">Loam</mat-option>
                  <mat-option value="sandy">Sandy</mat-option>
                  <mat-option value="silt">Silt</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Main Crops</mat-label>
                <input matInput formControlName="crop_variety" placeholder="e.g., Rice, Wheat, Cotton" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Irrigation Type</mat-label>
                <mat-select formControlName="irrigation_type">
                  <mat-option value="">Select Irrigation</mat-option>
                  <mat-option value="drip">Drip</mat-option>
                  <mat-option value="flood">Flood</mat-option>
                  <mat-option value="sprinkler">Sprinkler</mat-option>
                  <mat-option value="rainwater">Rainwater</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" />
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="sections-grid">
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Soil & Land Intelligence</mat-card-title>
            </mat-card-header>

            <mat-card-content formGroupName="soil">
              <div class="section-grid compact-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Soil Type</mat-label>
                  <input matInput formControlName="type" placeholder="Clay, loam, sandy..." />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Soil pH</mat-label>
                  <input matInput type="number" formControlName="ph" min="0" max="14" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nitrogen (N)</mat-label>
                  <input matInput type="number" formControlName="nitrogen" min="0" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Phosphorus (P)</mat-label>
                  <input matInput type="number" formControlName="phosphorus" min="0" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Potassium (K)</mat-label>
                  <input matInput type="number" formControlName="potassium" min="0" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Soil Moisture (%)</mat-label>
                  <input matInput type="number" formControlName="moisture" min="0" max="100" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-span">
                  <mat-label>Soil Health Status</mat-label>
                  <input matInput formControlName="health_status" readonly />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>AI Recommendations</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="ai-actions">
                <button mat-raised-button color="primary" type="button" (click)="generateAIAdvice()" [disabled]="isGeneratingAIAdvice()">
                  <mat-icon>auto_awesome</mat-icon>
                  {{ isGeneratingAIAdvice() ? 'Generating...' : 'Generate Advice' }}
                </button>
              </div>

              @if (aiAdvisor()) {
                <div class="ai-card-grid">
                  <article class="ai-info-card">
                    <h4>Best Crop Recommendation</h4>
                    <p>{{ aiAdvisor()!.cropRecommendation }}</p>
                  </article>
                  <article class="ai-info-card">
                    <h4>Fertilizer Advice</h4>
                    <p>{{ aiAdvisor()!.fertilizer }}</p>
                  </article>
                  <article class="ai-info-card">
                    <h4>Irrigation Plan</h4>
                    <p>{{ aiAdvisor()!.irrigation }}</p>
                  </article>
                  <article class="ai-info-card">
                    <h4>Warnings</h4>
                    <p>{{ aiAdvisor()!.warnings }}</p>
                  </article>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Crop Planning</mat-card-title>
            </mat-card-header>

            <mat-card-content formGroupName="crop_planning">
              <div class="section-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Current Crop</mat-label>
                  <input matInput formControlName="current_crop" placeholder="Current crop" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Previous Crop</mat-label>
                  <input matInput formControlName="previous_crop" placeholder="Previous crop" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Season</mat-label>
                  <mat-select formControlName="season">
                    <mat-option value="">Select Season</mat-option>
                    <mat-option value="Kharif">Kharif</mat-option>
                    <mat-option value="Rabi">Rabi</mat-option>
                    <mat-option value="Zaid">Zaid</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Sowing Date</mat-label>
                  <input matInput type="date" formControlName="sowing_date" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Expected Harvest Date</mat-label>
                  <input matInput type="date" formControlName="harvest_date" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Crop Duration (days)</mat-label>
                  <input matInput formControlName="duration_days" readonly />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card analytics-card">
            <mat-card-header>
              <mat-card-title>Farm Analytics Dashboard</mat-card-title>
            </mat-card-header>

            <mat-card-content formGroupName="analytics">
              <div class="metrics-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Total Yield (kg)</mat-label>
                  <input matInput type="number" formControlName="yield_kg" min="0" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Total Cost (₹)</mat-label>
                  <input matInput type="number" formControlName="cost" min="0" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Revenue (₹)</mat-label>
                  <input matInput type="number" formControlName="revenue" min="0" step="0.1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Profit / Loss (₹)</mat-label>
                  <input matInput formControlName="profit" readonly />
                </mat-form-field>
              </div>

              <div class="analytics-strip">
                <div class="analytics-pill">
                  <span>Profit Trend</span>
                  <strong [class.profit-positive]="profitValue() !== null && profitValue()! >= 0" [class.profit-negative]="profitValue() !== null && profitValue()! < 0">
                    {{ profitValue() === null ? 'Unavailable' : (profitValue()! >= 0 ? 'Profit' : 'Loss') }}
                  </strong>
                </div>
                <div class="analytics-pill">
                  <span>Net Value</span>
                  <strong>{{ profitValue() === null ? '0' : (profitValue()! | number:'1.0-2') }} ₹</strong>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Farm Assets</mat-card-title>
            </mat-card-header>

            <mat-card-content formGroupName="assets">
              <div class="section-grid">
                <mat-form-field appearance="outline" class="full-span">
                  <mat-label>Equipment Owned</mat-label>
                  <textarea matInput rows="2" formControlName="equipment" placeholder="Tractor, sprayer, plough..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Livestock Count</mat-label>
                  <input matInput type="number" formControlName="livestock" min="0" step="1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Storage Capacity (kg)</mat-label>
                  <input matInput type="number" formControlName="storage" min="0" step="1" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Workers Count</mat-label>
                  <input matInput type="number" formControlName="workers" min="0" step="1" />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Farm Image Upload</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="upload-grid">
                <div class="upload-panel">
                  <input type="file" accept="image/*" (change)="onImageSelected($event)" />
                  <p>Upload a farm image. Only image files up to 2MB are allowed.</p>
                  <button mat-stroked-button color="primary" type="button" (click)="analyzeSelectedImage()" [disabled]="!canAnalyzeSelectedImage()">
                    <mat-icon>biotech</mat-icon>
                    {{ isAnalyzingImage() ? 'Analyzing...' : 'Analyze Crop Image' }}
                  </button>
                </div>

                <div class="preview-panel">
                  @if (selectedImagePreview()) {
                    <img [src]="selectedImagePreview()!" alt="Farm preview" />
                  } @else {
                    <div class="preview-placeholder">Preview will appear here</div>
                  }
                </div>
              </div>

              @if (aiImageAnalysis()) {
                <div class="ai-image-analysis">
                  <article class="ai-info-card">
                    <h4>Disease</h4>
                    <p>{{ aiImageAnalysis()!.disease }}</p>
                  </article>
                  <article class="ai-info-card">
                    <h4>Cause</h4>
                    <p>{{ aiImageAnalysis()!.cause }}</p>
                  </article>
                  <article class="ai-info-card">
                    <h4>Treatment</h4>
                    <p>{{ aiImageAnalysis()!.treatment }}</p>
                  </article>
                  <article class="ai-info-card">
                    <h4>Prevention</h4>
                    <p>{{ aiImageAnalysis()!.prevention }}</p>
                  </article>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card alerts-card">
            <mat-card-header>
              <mat-card-title>Smart Alerts</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <div class="ai-actions">
                <button mat-stroked-button color="primary" type="button" (click)="generateAISmartAlerts()" [disabled]="isGeneratingSmartAlerts()">
                  <mat-icon>auto_fix_high</mat-icon>
                  {{ isGeneratingSmartAlerts() ? 'Generating...' : 'Generate AI Smart Alerts' }}
                </button>
              </div>

              @if (aiSmartAlerts().length > 0) {
                <div class="ai-smart-alerts-list">
                  @for (item of aiSmartAlerts(); track $index) {
                    <article class="ai-smart-alert-item">{{ item }}</article>
                  }
                </div>
              }

              @if (alerts().length > 0) {
                <div class="alerts-grid">
                  @for (alert of alerts(); track alert.id) {
                    <article class="alert-item" [class]="'alert-' + alert.severity">
                      <div class="alert-topline">
                        <strong>{{ alert.title }}</strong>
                        <span>{{ alert.alert_type | titlecase }}</span>
                      </div>
                      <p>{{ alert.description }}</p>
                      <small>{{ alert.created_at | date:'short' }}</small>
                    </article>
                  }
                </div>
              } @else {
                <p class="empty-alerts">No active smart alerts right now. They will appear automatically when soil or planning conditions change.</p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>Farm Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (profile()) {
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="label">Farm Area</span>
                  <span class="value">{{ profile()!.total_land }} hectares</span>
                </div>
                <div class="summary-item">
                  <span class="label">Soil Health</span>
                  <span class="value">{{ soilHealth() }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Crop Duration</span>
                  <span class="value">{{ cropDurationDays() === null ? 'Not available' : cropDurationDays() + ' days' }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Profit / Loss</span>
                  <span class="value" [class.profit-positive]="profitValue() !== null && profitValue()! >= 0" [class.profit-negative]="profitValue() !== null && profitValue()! < 0">
                    {{ profitValue() === null ? 'Not available' : (profitValue()! | number:'1.0-2') + ' ₹' }}
                  </span>
                </div>
              </div>
            } @else {
              <p class="summary-empty">Create your farm profile to activate analytics and alerts.</p>
            }
          </mat-card-content>
        </mat-card>

        <div class="form-actions">
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="profileForm.invalid || isSaving() || isUploading() || isLoading()"
          >
            <mat-icon>save</mat-icon>
            {{ isSaving() ? 'Saving...' : (isUploading() ? 'Uploading...' : 'Save Farm Profile') }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .farm-profile {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;

      h2 {
        color: #2e7d32;
        margin: 0 0 6px 0;
      }

      p {
        margin: 0;
        color: #5e6f5f;
      }
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 20px 0 8px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .sections-grid {
      display: grid;
      gap: 18px;
      margin-top: 18px;
    }

    .profile-card,
    .section-card,
    .summary-card {
      background: white;
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(28, 63, 36, 0.08);
    }

    .section-grid,
    .metrics-grid,
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .compact-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .full-span {
      grid-column: 1 / -1;
    }

    .analytics-strip {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .analytics-pill {
      flex: 1 1 180px;
      padding: 12px 14px;
      border-radius: 12px;
      background: #f5fbf5;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;

      span {
        color: #5b6b5d;
        font-size: 13px;
      }

      strong {
        font-size: 14px;
      }
    }

    .profit-positive {
      color: #2e7d32;
    }

    .profit-negative {
      color: #c62828;
    }

    .ai-actions {
      margin-bottom: 14px;
      display: flex;
      justify-content: flex-end;
    }

    .ai-card-grid,
    .ai-image-analysis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .ai-info-card {
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #dce7dc;
      background: #f8fbf8;

      h4 {
        margin: 0 0 6px 0;
        color: #305e35;
      }

      p {
        margin: 0;
        color: #4c624f;
        line-height: 1.5;
      }
    }

    .ai-smart-alerts-list {
      display: grid;
      gap: 10px;
      margin-bottom: 14px;
    }

    .ai-smart-alert-item {
      border-radius: 10px;
      border: 1px solid #c9ddc9;
      background: #f2faf2;
      padding: 10px 12px;
      color: #39543c;
      line-height: 1.45;
    }

    .upload-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: stretch;
    }

    .upload-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;

      p {
        margin: 0;
        color: #5e6f5f;
      }
    }

    .preview-panel {
      min-height: 220px;
      border-radius: 14px;
      overflow: hidden;
      border: 1px dashed #c9d9ca;
      background: #f7fbf7;
      display: grid;
      place-items: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .preview-placeholder {
      color: #809081;
      font-weight: 500;
    }

    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }

    .alert-item {
      border-radius: 12px;
      padding: 14px;
      border: 1px solid #e1e7e1;
      background: #fafdf9;

      &.alert-high,
      &.alert-critical {
        border-color: #ef9a9a;
        background: #fff7f7;
      }

      &.alert-medium {
        border-color: #ffe082;
        background: #fffdf4;
      }

      &.alert-low {
        border-color: #b7dfb9;
      }

      .alert-topline {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;

        span {
          color: #6d7b6e;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      }

      p {
        margin: 0 0 8px 0;
        color: #475548;
        line-height: 1.5;
      }

      small {
        color: #7c8a7d;
      }
    }

    .empty-alerts,
    .summary-empty {
      margin: 0;
      color: #6d7b6e;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;

      .label {
        font-size: 12px;
        color: #999;
        margin-bottom: 8px;
      }

      .value {
        font-size: 18px;
        font-weight: 600;
        color: #2e7d32;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 18px;

      button {
        min-width: 200px;
      }
    }

    @media (max-width: 768px) {
      .farm-profile {
        padding: 16px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .upload-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmProfileComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected farmerService = inject(FarmerService);
  protected snackBar = inject(MatSnackBar);
  protected fb = inject(FormBuilder);

  protected profile = signal<FarmerProfile | null>(null);
  protected alerts = signal<FarmerAlert[]>([]);
  protected soilHealth = signal('Poor');
  protected cropDurationDays = signal<number | null>(null);
  protected profitValue = signal<number | null>(null);
  protected selectedImagePreview = signal<string | null>(null);
  protected aiAdvisor = signal<AIAdvisorResponse | null>(null);
  protected aiImageAnalysis = signal<AIImageAnalysisResponse | null>(null);
  protected aiSmartAlerts = signal<string[]>([]);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected isUploading = signal(false);
  protected isGeneratingAIAdvice = signal(false);
  protected isAnalyzingImage = signal(false);
  protected isGeneratingSmartAlerts = signal(false);

  private selectedImageFile: File | null = null;

  protected profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', [Validators.required, Validators.minLength(3)]],
    total_land: [0, [Validators.required, Validators.min(0.1)]],
    soil_type: [''],
    crop_variety: [''],
    irrigation_type: [''],
    phone: [''],
    soil: this.fb.group({
      type: [''],
      ph: [null as number | null, [Validators.min(0), Validators.max(14)]],
      nitrogen: [null as number | null, [Validators.min(0)]],
      phosphorus: [null as number | null, [Validators.min(0)]],
      potassium: [null as number | null, [Validators.min(0)]],
      moisture: [null as number | null, [Validators.min(0), Validators.max(100)]],
      health_status: ['Poor'],
    }),
    crop_planning: this.fb.group({
      current_crop: [''],
      previous_crop: [''],
      season: ['Kharif'],
      sowing_date: [''],
      harvest_date: [''],
      duration_days: [null as number | null],
    }),
    analytics: this.fb.group({
      yield_kg: [null as number | null, [Validators.min(0)]],
      cost: [null as number | null, [Validators.min(0)]],
      revenue: [null as number | null, [Validators.min(0)]],
      profit: [null as number | null],
    }),
    assets: this.fb.group({
      equipment: [''],
      livestock: [null as number | null, [Validators.min(0)]],
      storage: [null as number | null, [Validators.min(0)]],
      workers: [null as number | null, [Validators.min(0)]],
    }),
    farm_image: [''],
  });

  constructor() {
    this.setupDerivedFields();
    this.loadProfile();
    this.loadAlerts();
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.farmerService.getFarmerProfile()
      .pipe(
        catchError(() => {
          return of(null);
        })
      )
      .subscribe(profile => {
        if (profile) {
          this.profile.set(profile);
          this.patchProfileForm(profile);
          this.selectedImagePreview.set(profile.farm_image || profile.profile_image || null);
        }
        this.isLoading.set(false);
      });
  }

  protected reloadProfile(): void {
    this.loadProfile();
    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.farmerService.getFarmerAlerts(25)
      .pipe(catchError(() => of([])))
      .subscribe((rows) => this.alerts.set(rows));
  }

  private setupDerivedFields(): void {
    this.profileForm.controls.soil.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalculateSoilHealth());

    this.profileForm.controls.crop_planning.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalculateCropDuration());

    this.profileForm.controls.analytics.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalculateProfit());
  }

  private patchProfileForm(profile: FarmerProfile): void {
    this.profileForm.patchValue({
      name: profile.name,
      location: profile.location,
      total_land: profile.total_land,
      soil_type: profile.soil_type,
      crop_variety: profile.crop_variety,
      irrigation_type: profile.irrigation_type,
      phone: profile.phone,
      soil: {
        type: profile.soil?.type ?? profile.soil_type ?? '',
        ph: profile.soil?.ph ?? null,
        nitrogen: profile.soil?.nitrogen ?? null,
        phosphorus: profile.soil?.phosphorus ?? null,
        potassium: profile.soil?.potassium ?? null,
        moisture: profile.soil?.moisture ?? null,
        health_status: profile.soil?.health_status ?? 'Poor',
      },
      crop_planning: {
        current_crop: profile.crop_planning?.current_crop ?? profile.crop_variety ?? '',
        previous_crop: profile.crop_planning?.previous_crop ?? '',
        season: profile.crop_planning?.season ?? 'Kharif',
        sowing_date: this.formatDateForInput(profile.crop_planning?.sowing_date),
        harvest_date: this.formatDateForInput(profile.crop_planning?.harvest_date),
        duration_days: profile.crop_planning?.duration_days ?? null,
      },
      analytics: {
        yield_kg: profile.analytics?.yield_kg ?? null,
        cost: profile.analytics?.cost ?? null,
        revenue: profile.analytics?.revenue ?? null,
        profit: profile.analytics?.profit ?? null,
      },
      assets: {
        equipment: profile.assets?.equipment?.join(', ') ?? '',
        livestock: profile.assets?.livestock ?? null,
        storage: profile.assets?.storage ?? null,
        workers: profile.assets?.workers ?? null,
      },
      farm_image: profile.farm_image ?? profile.profile_image ?? '',
    }, { emitEvent: false });

    this.soilHealth.set(profile.soil?.health_status ?? 'Poor');
    this.cropDurationDays.set(profile.crop_planning?.duration_days ?? null);
    this.profitValue.set(profile.analytics?.profit ?? null);
    this.recalculateSoilHealth();
    this.recalculateCropDuration();
    this.recalculateProfit();
  }

  private recalculateSoilHealth(): void {
    const soil = this.profileForm.controls.soil.getRawValue();
    const status = this.calculateSoilHealth(
      this.toNumber(soil.ph),
      this.toNumber(soil.moisture),
      this.toNumber(soil.nitrogen),
      this.toNumber(soil.phosphorus),
      this.toNumber(soil.potassium),
    );
    this.soilHealth.set(status);
    this.profileForm.controls.soil.patchValue({ health_status: status }, { emitEvent: false });
  }

  private recalculateCropDuration(): void {
    const cropPlanning = this.profileForm.controls.crop_planning.getRawValue();
    const sowingDate = this.parseDateInput(cropPlanning.sowing_date);
    const harvestDate = this.parseDateInput(cropPlanning.harvest_date);
    const duration = this.calculateDurationDays(sowingDate, harvestDate);
    this.cropDurationDays.set(duration);
    this.profileForm.controls.crop_planning.patchValue({ duration_days: duration }, { emitEvent: false });
  }

  private recalculateProfit(): void {
    const analytics = this.profileForm.controls.analytics.getRawValue();
    const cost = this.toNumber(analytics.cost);
    const revenue = this.toNumber(analytics.revenue);
    const profit = cost !== null && revenue !== null ? revenue - cost : null;
    this.profitValue.set(profit);
    this.profileForm.controls.analytics.patchValue({ profit }, { emitEvent: false });
  }

  private calculateSoilHealth(
    ph: number | null,
    moisture: number | null,
    nitrogen: number | null,
    phosphorus: number | null,
    potassium: number | null,
  ): string {
    const nutrientValues = [nitrogen, phosphorus, potassium].filter((value): value is number => value !== null);
    const balancedNutrients = nutrientValues.length === 3 && Math.max(...nutrientValues) - Math.min(...nutrientValues) <= 60;
    const good = ph !== null && ph >= 6 && ph <= 7.5 && moisture !== null && moisture > 40 && balancedNutrients;
    if (good) {
      return 'Good';
    }

    const moderate = ph !== null && ph >= 5.5 && ph <= 8.0 && moisture !== null && moisture >= 25 && nutrientValues.length >= 2;
    return moderate ? 'Moderate' : 'Poor';
  }

  private calculateDurationDays(sowingDate: Date | null, harvestDate: Date | null): number | null {
    if (!sowingDate || !harvestDate) {
      return null;
    }

    const diff = harvestDate.getTime() - sowingDate.getTime();
    if (diff < 0) {
      return null;
    }

    return Math.round(diff / 86400000);
  }

  private parseDateInput(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDateForInput(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toISOString().slice(0, 10);
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private buildPayload(): Partial<FarmerProfile> {
    const raw = this.profileForm.getRawValue();
    const equipment = String(raw.assets?.equipment ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      name: raw.name?.trim(),
      location: raw.location?.trim(),
      total_land: this.toNumber(raw.total_land) ?? 0,
      soil_type: raw.soil_type?.trim() || raw.soil?.type?.trim() || null,
      crop_variety: raw.crop_variety?.trim() || null,
      irrigation_type: raw.irrigation_type?.trim() || null,
      phone: raw.phone?.trim() || null,
      farm_image: raw.farm_image?.trim() || this.selectedImagePreview() || null,
      soil: {
        type: raw.soil?.type?.trim() || raw.soil_type?.trim() || null,
        ph: this.toNumber(raw.soil?.ph),
        nitrogen: this.toNumber(raw.soil?.nitrogen),
        phosphorus: this.toNumber(raw.soil?.phosphorus),
        potassium: this.toNumber(raw.soil?.potassium),
        moisture: this.toNumber(raw.soil?.moisture),
        health_status: raw.soil?.health_status || this.soilHealth(),
      },
      crop_planning: {
        current_crop: raw.crop_planning?.current_crop?.trim() || raw.crop_variety?.trim() || null,
        previous_crop: raw.crop_planning?.previous_crop?.trim() || null,
        season: raw.crop_planning?.season || null,
        sowing_date: this.normalizeDateValue(raw.crop_planning?.sowing_date),
        harvest_date: this.normalizeDateValue(raw.crop_planning?.harvest_date),
        duration_days: this.cropDurationDays(),
      },
      analytics: {
        yield_kg: this.toNumber(raw.analytics?.yield_kg),
        cost: this.toNumber(raw.analytics?.cost),
        revenue: this.toNumber(raw.analytics?.revenue),
        profit: this.profitValue(),
      },
      assets: {
        equipment,
        livestock: this.toNumber(raw.assets?.livestock),
        storage: this.toNumber(raw.assets?.storage),
        workers: this.toNumber(raw.assets?.workers),
      },
    };
  }

  private normalizeDateValue(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toISOString();
  }

  protected submitProfile(): void {
    if (!this.profileForm.valid) return;

    this.isSaving.set(true);
    const payload = this.buildPayload();

    const persistProfile = (farmImageUrl?: string | null) => {
      const finalPayload = {
        ...payload,
        farm_image: farmImageUrl ?? payload.farm_image ?? null,
      };

      return this.profile()
        ? this.farmerService.updateFarmerProfile(finalPayload)
        : this.farmerService.createFarmerProfile(finalPayload);
    };

    const request$ = this.selectedImageFile
      ? (() => {
          this.isUploading.set(true);
          return this.farmerService.uploadFarmImage(this.selectedImageFile).pipe(
            switchMap((response) => persistProfile(response.image_url))
          );
        })()
      : persistProfile();

    request$
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to save farm profile', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe((profile) => {
        if (profile) {
          this.profile.set(profile);
          this.patchProfileForm(profile);
          this.selectedImagePreview.set(profile.farm_image || profile.profile_image || null);
          this.selectedImageFile = null;
          this.loadAlerts();
          this.snackBar.open('Farm profile saved successfully', 'Close', { duration: 2200 });
        }

        this.isSaving.set(false);
        this.isUploading.set(false);
      });
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Only image files are allowed', 'Close', { duration: 2500 });
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('Image must be 2MB or smaller', 'Close', { duration: 2500 });
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImagePreview.set(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  }

  protected canAnalyzeSelectedImage(): boolean {
    return !!this.selectedImageFile && !this.isAnalyzingImage();
  }

  protected analyzeSelectedImage(): void {
    if (!this.selectedImageFile) {
      this.snackBar.open('Select an image first', 'Close', { duration: 2200 });
      return;
    }

    const crop =
      this.profileForm.controls.crop_planning.controls.current_crop.value ||
      this.profileForm.controls.crop_variety.value ||
      undefined;
    const location = this.profileForm.controls.location.value || undefined;

    this.isAnalyzingImage.set(true);
    this.farmerService
      .analyzeCropImage(this.selectedImageFile, crop || undefined, location || undefined)
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to analyze crop image', 'Close', { duration: 3000 });
          this.isAnalyzingImage.set(false);
          return of(null);
        })
      )
      .subscribe((analysis) => {
        if (analysis) {
          this.aiImageAnalysis.set(analysis);
          this.snackBar.open('Image analyzed successfully', 'Close', { duration: 2200 });
        }
        this.isAnalyzingImage.set(false);
      });
  }

  protected generateAIAdvice(): void {
    const soil = this.profileForm.controls.soil.getRawValue();
    const planning = this.profileForm.controls.crop_planning.getRawValue();
    const location = this.profileForm.controls.location.value?.trim();

    const ph = this.toNumber(soil.ph);
    const n = this.toNumber(soil.nitrogen);
    const p = this.toNumber(soil.phosphorus);
    const k = this.toNumber(soil.potassium);
    const moisture = this.toNumber(soil.moisture);
    const crop = planning.current_crop?.trim() || this.profileForm.controls.crop_variety.value?.trim();

    if (ph === null || n === null || p === null || k === null || moisture === null || !crop || !location) {
      this.snackBar.open('Fill soil metrics, crop, and location before generating AI advice', 'Close', { duration: 3000 });
      return;
    }

    this.isGeneratingAIAdvice.set(true);
    this.farmerService
      .getAIAdvisor({ ph, n, p, k, moisture, crop, location })
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to generate AI recommendations', 'Close', { duration: 3000 });
          this.isGeneratingAIAdvice.set(false);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          this.aiAdvisor.set(response);
        }
        this.isGeneratingAIAdvice.set(false);
      });
  }

  protected generateAISmartAlerts(): void {
    const soil = this.profileForm.controls.soil.getRawValue();
    const planning = this.profileForm.controls.crop_planning.getRawValue();
    const location = this.profileForm.controls.location.value || undefined;
    const ph = this.toNumber(soil.ph) ?? undefined;
    const moisture = this.toNumber(soil.moisture) ?? undefined;
    const crop = planning.current_crop?.trim() || this.profileForm.controls.crop_variety.value?.trim() || undefined;

    this.isGeneratingSmartAlerts.set(true);
    this.farmerService
      .generateAISmartAlerts({ ph, moisture, crop, location })
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to generate AI smart alerts', 'Close', { duration: 3000 });
          this.isGeneratingSmartAlerts.set(false);
          return of(null);
        })
      )
      .subscribe((response) => {
        this.aiSmartAlerts.set(response?.alerts ?? []);
        this.isGeneratingSmartAlerts.set(false);
      });
  }
}
