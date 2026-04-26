import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { catchError, of } from 'rxjs';
import { FarmerService, FarmingTechnique } from '../../core/services/farmer.service';

@Component({
  selector: 'app-farming-techniques',
  standalone: true,
  imports: [
    CommonModule,
      FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
  ],
  template: `
    <section class="techniques-section">
      <h2>Farming Techniques & Best Practices</h2>

      <!-- Featured Techniques -->
      @if (featuredTechniques().length > 0) {
        <div class="featured-section">
          <h3>Featured Techniques</h3>
          <div class="featured-grid">
            @for (tech of featuredTechniques().slice(0, 3); track tech.id) {
              <mat-card class="featured-card">
                <mat-card-header>
                  <mat-card-title>{{ tech.title }}</mat-card-title>
                  <mat-card-subtitle>
                    <mat-chip size="small">{{ tech.category }}</mat-chip>
                    @if (tech.crop_type) {
                      <mat-chip size="small">{{ tech.crop_type }}</mat-chip>
                    }
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ tech.description.substring(0, 150) }}...</p>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button color="primary">
                    <mat-icon>read_more</mat-icon>
                    Read More
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        </div>
      }

      <!-- Category Filter -->
      <mat-card class="filter-card">
        <h3>Browse by Category</h3>
        <div class="category-filter">
          <mat-form-field appearance="outline">
            <mat-label>Filter by Category</mat-label>
            <mat-select
              [ngModel]="selectedCategory()"
              (ngModelChange)="selectedCategory.set(($event || '').trim()); filterTechniques()"
            >
              <mat-option value="">All Categories</mat-option>
              <mat-option value="soil">Soil Management</mat-option>
              <mat-option value="irrigation">Irrigation</mat-option>
              <mat-option value="pest">Pest Management</mat-option>
              <mat-option value="fertilizer">Fertilizer</mat-option>
              <mat-option value="harvesting">Harvesting</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Search Techniques</mat-label>
            <input
              matInput
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set(($event || '').trim()); filterTechniques()"
              placeholder="Search techniques..."
            />
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Techniques List -->
      @if (isLoading()) {
        <div class="loading">Loading techniques...</div>
      } @else if (filteredTechniques().length > 0) {
        <div class="techniques-grid">
          @for (tech of filteredTechniques(); track tech.id) {
            <mat-card class="technique-card">
              <mat-card-header>
                <mat-icon class="category-icon" [class]="'cat-' + sanitizeCategory(tech.category)">
                  {{ getCategoryIcon(tech.category) }}
                </mat-icon>
                <mat-card-title>{{ tech.title }}</mat-card-title>
                <mat-card-subtitle>By Expert #{{ tech.expert_id }}</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="tags">
                  <mat-chip size="small">{{ tech.category }}</mat-chip>
                  @if (tech.crop_type) {
                    <mat-chip size="small" color="primary">{{ tech.crop_type }}</mat-chip>
                  }
                </div>
                <p class="description">{{ tech.description.substring(0, 200) }}</p>
                <p class="posted-date">Posted: {{ formatDate(tech.created_at) }}</p>
              </mat-card-content>

              <mat-card-actions>
                <button mat-button color="accent">
                  <mat-icon>save</mat-icon>
                  Save
                </button>
                <button mat-button color="primary">
                  <mat-icon>share</mat-icon>
                  Share
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      } @else {
        <p class="no-data">No techniques found. Try different filters or search terms.</p>
      }
    </section>
  `,
  styles: [`
    .techniques-section {
      padding: 24px;
    }

    h2 {
      color: #2e7d32;
      margin-bottom: 32px;
    }

    h3 {
      color: #333;
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .featured-section {
      margin-bottom: 32px;
    }

    .featured-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .featured-card {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-left: 4px solid #2e7d32;

      mat-card-title {
        color: #1b5e20;
      }

      mat-chip {
        background: #fff9c4;
        color: #f57f17;
      }
    }

    .filter-card {
      background: white;
      margin-bottom: 24px;
      padding: 20px;
    }

    .category-filter {
      display: flex;
      gap: 16px;
      align-items: flex-end;

      mat-form-field {
        flex: 1;
        max-width: 300px;
      }
    }

    .techniques-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .technique-card {
      background: white;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      mat-card-header {
        position: relative;
        padding-bottom: 16px;

        .category-icon {
          position: absolute;
          top: 0;
          right: 16px;
          font-size: 32px;
          width: 32px;
          height: 32px;

          &.cat-soil {
            background: #d7ccc8;
            color: #5d4037;
          }

          &.cat-irrigation {
            background: #b3e5fc;
            color: #0277bd;
          }

          &.cat-pest {
            background: #ffccbc;
            color: #d84315;
          }

          &.cat-fertilizer {
            background: #c8e6c9;
            color: #2e7d32;
          }

          &.cat-harvesting {
            background: #fff9c4;
            color: #f57f17;
          }
        }
      }

      .tags {
        margin-bottom: 12px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        mat-chip {
          height: 24px;
          font-size: 12px;
        }
      }

      .description {
        color: #666;
        line-height: 1.5;
        margin: 12px 0;
        font-size: 14px;
      }

      .posted-date {
        font-size: 12px;
        color: #999;
        margin: 8px 0 0;
      }

      mat-card-actions {
        button {
          font-size: 12px;
        }
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
      .techniques-section {
        padding: 16px;
      }

      .featured-grid {
        grid-template-columns: 1fr;
      }

      .techniques-grid {
        grid-template-columns: 1fr;
      }

      .category-filter {
        flex-direction: column;
        align-items: stretch;

        mat-form-field {
          max-width: 100%;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmingTechniquesComponent implements OnDestroy {
  protected farmerService = inject(FarmerService);
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

  protected allTechniques = signal<FarmingTechnique[]>([]);
  protected filteredTechniques = signal<FarmingTechnique[]>([]);
  protected featuredTechniques = signal<FarmingTechnique[]>([]);
  protected selectedCategory = signal('');
  protected searchTerm = signal('');
  protected isLoading = signal(false);

  private isFeaturedTechnique(technique: FarmingTechnique | null | undefined): boolean {
    if (!technique) {
      return false;
    }

    const maybeTechnique = technique as FarmingTechnique & { isFeatured?: boolean };
    return Boolean(maybeTechnique.is_featured ?? maybeTechnique.isFeatured ?? false);
  }

  private mergeFeaturedTechniques(primary: FarmingTechnique[], secondary: FarmingTechnique[]): FarmingTechnique[] {
    const merged = [...primary, ...secondary];
    const uniqueById = new Map<number, FarmingTechnique>();

    for (const technique of merged) {
      uniqueById.set(technique.id, technique);
    }

    return Array.from(uniqueById.values());
  }

  constructor() {
    this.loadTechniques();
    this.refreshIntervalId = setInterval(() => this.loadTechniques(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }

  protected loadTechniques(): void {
    this.isLoading.set(true);

    // Load all techniques
    this.farmerService.getFarmingTechniques()
      .pipe(
        catchError(() => {
          this.isLoading.set(false);
          return of([]);
        })
      )
      .subscribe(techniques => {
        this.allTechniques.set(techniques);
        this.featuredTechniques.set(techniques.filter(tech => this.isFeaturedTechnique(tech)));
        this.filterTechniques();
        this.isLoading.set(false);
      });

    // Load featured techniques
    this.farmerService.getFeaturedTechniques()
      .pipe(catchError(() => of([])))
      .subscribe(featured => {
        if (featured.length === 0) {
          return;
        }

        this.featuredTechniques.set(
          this.mergeFeaturedTechniques(
            this.allTechniques().filter(tech => this.isFeaturedTechnique(tech)),
            featured
          )
        );
      });
  }

  protected filterTechniques(): void {
    const category = this.selectedCategory().toLowerCase();
    const search = this.searchTerm().toLowerCase();

    const filtered = this.allTechniques().filter(tech => {
      const categoryMatch = !category || tech.category.toLowerCase().includes(category);
      const searchMatch = !search || 
        tech.title.toLowerCase().includes(search) ||
        tech.description.toLowerCase().includes(search);

      return categoryMatch && searchMatch;
    });

    this.filteredTechniques.set(filtered);
  }

  protected getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      soil: 'nature',
      irrigation: 'water',
      pest: 'bug_report',
      fertilizer: 'grass',
      harvesting: 'agriculture',
      disease: 'warning',
    };

    return icons[category.toLowerCase()] || 'lightbulb';
  }

  protected sanitizeCategory(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
