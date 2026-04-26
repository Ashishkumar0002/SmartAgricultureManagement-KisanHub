import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of } from 'rxjs';
import { FarmerService, CropInformation } from '../../core/services/farmer.service';

@Component({
  selector: 'app-crop-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <section class="crop-info">
      <h2>Crop Information & Guides</h2>

      <mat-card class="search-card">
        <div class="search-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Search Crop</mat-label>
            <input
              matInput
              [ngModel]="searchCrop()"
              (ngModelChange)="searchCrop.set($event)"
              (keyup.enter)="loadCropGuides()"
              placeholder="e.g., Rice, Wheat, Cotton"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Category</mat-label>
            <mat-select [value]="selectedCategory()" (selectionChange)="selectedCategory.set($event.value); loadCropGuides()">
              <mat-option value="all">All Categories</mat-option>
              <mat-option value="fruits">Fruits</mat-option>
              <mat-option value="vegetables">Vegetables</mat-option>
              <mat-option value="others">Others</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="primary" type="button" (click)="loadCropGuides()">
            <mat-icon>search</mat-icon>
            Search
          </button>
          <button mat-stroked-button color="primary" type="button" (click)="showAllCropGuides()">
            <mat-icon>grid_view</mat-icon>
            Filter Crops
          </button>
        </div>
      </mat-card>

      @if (isLoading()) {
        <div class="loading">Loading crop guides...</div>
      } @else if (cropGuides().length > 0) {
        <div class="guides-grid">
          @for (guide of cropGuides(); track guide.crop_name) {
            <mat-card class="guide-card">
              <mat-card-header>
                <mat-card-title>{{ guide.crop_name }}</mat-card-title>
                <mat-card-subtitle>{{ guide.category }} • {{ guide.season }}</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="label">Soil Type</span>
                    <strong>{{ guide.soil_type }}</strong>
                  </div>
                  <div class="summary-item">
                    <span class="label">Temperature</span>
                    <strong>{{ guide.temperature }}</strong>
                  </div>
                  <div class="summary-item">
                    <span class="label">Water Requirement</span>
                    <strong>{{ guide.water_requirement }}</strong>
                  </div>
                  <div class="summary-item">
                    <span class="label">Irrigation</span>
                    <strong>{{ guide.irrigation }}</strong>
                  </div>
                </div>

                <div class="detail-block">
                  <h4>Fertilizer Recommendation</h4>
                  <p>Nitrogen: {{ guide.fertilizer.nitrogen }}</p>
                  <p>Phosphorus: {{ guide.fertilizer.phosphorus }}</p>
                  <p>Potassium: {{ guide.fertilizer.potassium }}</p>
                </div>

                <div class="detail-block">
                  <h4>Sowing & Harvest</h4>
                  <p><strong>Sowing Time:</strong> {{ guide.sowing_time }}</p>
                  <p><strong>Harvest Time:</strong> {{ guide.harvest_time }}</p>
                </div>

                <div class="detail-block">
                  <h4>Common Diseases</h4>
                  <div class="tag-list">
                    @for (disease of guide.common_diseases; track disease) {
                      <span class="tag">{{ disease }}</span>
                    }
                  </div>
                </div>

                <div class="detail-block">
                  <h4>Solutions</h4>
                  <div class="tag-list">
                    @for (solution of guide.solutions; track solution) {
                      <span class="tag tag-success">{{ solution }}</span>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else {
        <p class="no-data">No crop information found. Try searching for a specific crop or show all 30 crops.</p>
      }
    </section>
  `,
  styles: [`
    .crop-info {
      padding: 24px;
    }

    h2 {
      color: #2e7d32;
      margin-bottom: 24px;
    }

    .search-card {
      background: white;
      margin-bottom: 24px;
      padding: 16px;
    }

    .search-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .full-width {
      flex: 1 1 320px;
    }

    .filter-field {
      min-width: 220px;
    }

    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .guide-card {
      background: white;
      border-radius: 14px;

      mat-card-header {
        margin-bottom: 12px;
      }

      mat-card-title {
        color: #1f5f26;
        font-size: 18px;
        font-weight: 700;
      }

      mat-card-subtitle {
        color: #4a5d4b;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .summary-item,
      .detail-block {
        padding: 12px;
        background: #f7fbf7;
        border: 1px solid #e2eee3;
        border-radius: 10px;
      }

      .summary-item .label {
        display: block;
        font-size: 12px;
        color: #6a7d6c;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .summary-item strong {
        color: #163d1a;
        font-size: 14px;
      }

      .detail-block {
        margin-top: 10px;

        h4 {
          margin: 0 0 8px;
          color: #1f5f26;
          font-size: 14px;
        }

        p {
          margin: 4px 0;
          line-height: 1.5;
          color: #4d5e4e;
        }
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tag {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: #eef5ef;
        color: #214f24;
        font-size: 12px;
        font-weight: 600;
      }

      .tag-success {
        background: #e7f4e8;
        color: #1f6b27;
      }
    }

    .no-data {
      color: #999;
      text-align: center;
      padding: 48px 24px;
      font-style: italic;
    }

    .loading {
      color: #999;
      text-align: center;
      padding: 24px;
    }

    @media (max-width: 768px) {
      .crop-info {
        padding: 16px;
      }

      .guides-grid {
        grid-template-columns: 1fr;
      }

      .search-row {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropInfoComponent {
  protected farmerService = inject(FarmerService);

  protected cropGuides = signal<CropInformation[]>([]);
  protected searchCrop = signal('');
  protected selectedCategory = signal<'all' | 'fruits' | 'vegetables' | 'others'>('all');
  protected isLoading = signal(false);

  constructor() {
    this.loadCropGuides();
  }

  protected loadCropGuides(): void {
    this.isLoading.set(true);
    const crop = this.searchCrop().trim() || undefined;
    const category = this.selectedCategory();

    this.farmerService.getCropGuides(crop, 30, category)
      .pipe(
        catchError(() => {
          this.isLoading.set(false);
          return of([]);
        })
      )
      .subscribe(guides => {
        this.cropGuides.set(guides);
        this.isLoading.set(false);
      });
  }

  protected showAllCropGuides(): void {
    this.searchCrop.set('');
    this.loadCropGuides();
  }
}
