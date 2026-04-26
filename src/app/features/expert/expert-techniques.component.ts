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
import { catchError, of } from 'rxjs';

import { ExpertService, FarmingTechnique, FarmingTechniqueIn } from '../../core/services/expert.service';

@Component({
  selector: 'app-expert-techniques',
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
  ],
  template: `
    <div class="techniques-container">
      <div class="techniques-header">
        <h2>Knowledge Sharing Platform</h2>
        <p>Share farming techniques, best practices, and expert tips</p>
      </div>

      <mat-tab-group>
        <!-- Tab 1: Create New Technique -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>add_circle</mat-icon>
            <span>Add Technique</span>
          </ng-template>

          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <h3>Create New Farming Technique</h3>
              </mat-card-header>

              <mat-divider></mat-divider>

              <mat-card-content>
                <form [formGroup]="techniqueForm">
                  <!-- Title -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Technique Title</mat-label>
                    <input
                      matInput
                      formControlName="title"
                      placeholder="e.g., Drip Irrigation for Water Conservation"
                    />
                  </mat-form-field>

                  <!-- Description -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea
                      matInput
                      formControlName="description"
                      rows="5"
                      placeholder="Detailed description of the farming technique..."
                      maxlength="1000"
                    ></textarea>
                    <mat-hint align="end">
                      {{ techniqueForm.get('description')?.value?.length || 0 }}/1000
                    </mat-hint>
                  </mat-form-field>

                  <!-- Category -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Category</mat-label>
                    <mat-select formControlName="category">
                      <mat-option value="soil">Soil Management</mat-option>
                      <mat-option value="irrigation">Irrigation</mat-option>
                      <mat-option value="pest">Pest Control</mat-option>
                      <mat-option value="fertilizer">Fertilizer & Nutrition</mat-option>
                      <mat-option value="harvesting">Harvesting & Post-Harvest</mat-option>
                      <mat-option value="seed">Seed Management</mat-option>
                      <mat-option value="weather">Weather Management</mat-option>
                      <mat-option value="disease">Disease Prevention</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Crop Type -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Crop Type (optional)</mat-label>
                    <input
                      matInput
                      formControlName="crop_type"
                      placeholder="e.g., Wheat, Rice, Cotton"
                    />
                  </mat-form-field>

                  <!-- Featured Checkbox -->
                  <div class="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        [ngModel]="isFeatured()"
                        (ngModelChange)="isFeatured.set($event)"
                        [ngModelOptions]="{ standalone: true }"
                      />
                      <span>Mark as Featured Technique</span>
                    </label>
                  </div>

                  <!-- Submit Button -->
                  <div class="button-group">
                    <button
                      mat-raised-button
                      color="accent"
                      (click)="createTechnique()"
                      [disabled]="!techniqueForm.valid || isSubmitting()"
                    >
                      <mat-icon>publish</mat-icon>
                      <span>{{ isSubmitting() ? 'Publishing...' : 'Publish Technique' }}</span>
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Tab 2: My Techniques -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>lightbulb</mat-icon>
            <span>My Techniques</span>
          </ng-template>

          <div class="tab-content">
            <div class="filter-section">
              <mat-form-field appearance="outline" class="category-filter">
                <mat-label>Filter by Category</mat-label>
                <mat-select [ngModel]="selectedCategory()" (ngModelChange)="onCategoryChange($event)">
                  <mat-option value="">All Categories</mat-option>
                  <mat-option value="soil">Soil Management</mat-option>
                  <mat-option value="irrigation">Irrigation</mat-option>
                  <mat-option value="pest">Pest Control</mat-option>
                  <mat-option value="fertilizer">Fertilizer & Nutrition</mat-option>
                  <mat-option value="harvesting">Harvesting & Post-Harvest</mat-option>
                  <mat-option value="seed">Seed Management</mat-option>
                  <mat-option value="weather">Weather Management</mat-option>
                  <mat-option value="disease">Disease Prevention</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            @if (isLoadingTechniques()) {
              <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (techniques().length === 0) {
              <div class="empty-state">
                <mat-icon>library_books</mat-icon>
                <p>No techniques created yet</p>
              </div>
            } @else {
              <div class="techniques-grid">
                @for (technique of techniques(); track technique.id) {
                  <mat-card class="technique-card">
                    <mat-card-header>
                      <div class="technique-title">
                        <div class="category-badge" [ngClass]="'cat-' + technique.category">
                          {{ getCategoryIcon(technique.category) }}
                        </div>
                        <div>
                          <h3>{{ technique.title }}</h3>
                          @if (technique.is_featured) {
                            <span class="featured-badge">
                              <mat-icon>star</mat-icon>
                              Featured
                            </span>
                          }
                        </div>
                      </div>
                    </mat-card-header>

                    <mat-divider></mat-divider>

                    <mat-card-content>
                      <p class="description">{{ technique.description | slice:0:150 }}...</p>

                      @if (technique.crop_type) {
                        <div class="meta">
                          <strong>Crop Type:</strong> {{ technique.crop_type }}
                        </div>
                      }

                      <div class="meta">
                        <strong>Category:</strong> {{ technique.category }}
                      </div>

                      <p class="date">Created: {{ technique.created_at | date:'short' }}</p>
                    </mat-card-content>

                    <mat-divider></mat-divider>

                    <mat-card-actions>
                      <button mat-button (click)="editTechnique(technique)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                      <button
                        mat-button
                        (click)="toggleFeatured(technique)"
                      >
                        <mat-icon>{{ technique.is_featured ? 'star' : 'star_outline' }}</mat-icon>
                        {{ technique.is_featured ? 'Unfeature' : 'Feature' }}
                      </button>
                      <button mat-button color="warn" (click)="deleteTechnique(technique.id)">
                        <mat-icon>delete</mat-icon>
                        Delete
                      </button>
                    </mat-card-actions>
                  </mat-card>
                }
              </div>
            }
          </div>
        </mat-tab>

        <!-- Tab 3: Featured Techniques -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>star</mat-icon>
            <span>Featured</span>
          </ng-template>

          <div class="tab-content">
            @if (isLoadingTechniques()) {
              <div class="loading-spinner">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (featuredTechniques().length === 0) {
              <div class="empty-state">
                <mat-icon>star_outline</mat-icon>
                <p>No featured techniques yet</p>
              </div>
            } @else {
              <div class="featured-grid">
                @for (technique of featuredTechniques(); track technique.id) {
                  <mat-card class="featured-card">
                    <mat-card-header>
                      <div class="featured-header">
                        <mat-icon class="featured-icon">star</mat-icon>
                        <h3>{{ technique.title }}</h3>
                      </div>
                    </mat-card-header>

                    <mat-divider></mat-divider>

                    <mat-card-content>
                      <p class="description">{{ technique.description }}</p>

                      <div class="featured-meta">
                        <span class="badge" [ngClass]="'cat-' + technique.category">
                          {{ technique.category }}
                        </span>
                        @if (technique.crop_type) {
                          <span class="badge">{{ technique.crop_type }}</span>
                        }
                      </div>

                      <p class="date">Published: {{ technique.created_at | date:'short' }}</p>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .techniques-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .techniques-header {
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

      .checkbox-group {
        display: flex;
        align-items: center;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 6px;

        label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin: 0;

          input {
            cursor: pointer;
          }

          span {
            font-size: 14px;
            color: #333;
          }
        }
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

    .filter-section {
      margin-bottom: 20px;

      .category-filter {
        width: 100%;
        max-width: 300px;
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

    .techniques-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .technique-card {
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }

      mat-card-header {
        padding: 16px;
        display: flex;
        align-items: flex-start;
      }

      .technique-title {
        display: flex;
        gap: 12px;
        flex: 1;

        h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 6px 0;
          color: #1a1a1a;
        }

        .featured-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: #FFF9C4;
          color: #F57F17;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;

          mat-icon {
            font-size: 12px;
            width: 12px;
            height: 12px;
          }
        }
      }

      .category-badge {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        flex-shrink: 0;

        &.cat-soil {
          background: #8D6E63;
        }

        &.cat-irrigation {
          background: #00BCD4;
        }

        &.cat-pest {
          background: #E91E63;
        }

        &.cat-fertilizer {
          background: #4CAF50;
        }

        &.cat-harvesting {
          background: #FFC107;
          color: #333;
        }

        &.cat-seed {
          background: #8BC34A;
        }

        &.cat-weather {
          background: #2196F3;
        }

        &.cat-disease {
          background: #F44336;
        }
      }

      mat-card-content {
        padding: 16px;

        .description {
          font-size: 13px;
          line-height: 1.5;
          color: #666;
          margin: 0 0 12px 0;
        }

        .meta {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;

          strong {
            color: #1a1a1a;
          }
        }

        .date {
          font-size: 11px;
          color: #999;
          margin: 8px 0 0 0;
        }
      }

      mat-card-actions {
        padding: 12px 16px;
        display: flex;
        gap: 6px;

        button {
          flex: 1;
          font-size: 12px;
        }
      }
    }

    .featured-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .featured-card {
      border: 2px solid #FFC107;
      background: linear-gradient(135deg, #FFFEF5 0%, #FFFEF5 100%);

      mat-card-header {
        padding: 20px;
        display: flex;
        align-items: center;

        .featured-header {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;

          .featured-icon {
            color: #FFC107;
            font-size: 28px;
            width: 28px;
            height: 28px;
          }

          h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            color: #1a1a1a;
          }
        }
      }

      mat-card-content {
        padding: 20px;

        .description {
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          margin: 0 0 16px 0;
        }

        .featured-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;

          .badge {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            background: white;
            border: 1px solid #e0e0e0;

            &.cat-soil {
              background: #D7CCC8;
              color: #5D4037;
            }

            &.cat-irrigation {
              background: #B3E5FC;
              color: #01579B;
            }

            &.cat-pest {
              background: #F8BBD0;
              color: #880E4F;
            }

            &.cat-fertilizer {
              background: #C8E6C9;
              color: #1B5E20;
            }

            &.cat-harvesting {
              background: #FFF9C4;
              color: #F57F17;
            }

            &.cat-seed {
              background: #DCEDC8;
              color: #558B2F;
            }

            &.cat-weather {
              background: #BBDEFB;
              color: #1565C0;
            }

            &.cat-disease {
              background: #FFCCBC;
              color: #BF360C;
            }
          }
        }

        .date {
          font-size: 12px;
          color: #999;
          margin: 0;
        }
      }
    }

    @media (max-width: 768px) {
      .techniques-grid {
        grid-template-columns: 1fr;
      }

      .featured-grid {
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
export class ExpertTechniquesComponent {
  private expertService = inject(ExpertService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  protected techniques = signal<FarmingTechnique[]>([]);
  protected featuredTechniques = signal<FarmingTechnique[]>([]);
  protected selectedCategory = signal<string>('');
  protected isLoadingTechniques = signal(false);
  protected isSubmitting = signal(false);
  protected isFeatured = signal(false);

  protected techniqueForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    category: ['soil', Validators.required],
    crop_type: [''],
  });

  constructor() {
    this.loadTechniques();
  }

  private loadTechniques(): void {
    this.isLoadingTechniques.set(true);
    const categoryFilter = this.selectedCategory().trim();

    this.expertService.getExpertTechniques(categoryFilter || undefined)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error loading techniques', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe(techniques => {
        this.techniques.set(techniques);
        this.featuredTechniques.set(techniques.filter(t => t.is_featured));
        this.isLoadingTechniques.set(false);
      });
  }

  protected onCategoryChange(category: string): void {
    this.selectedCategory.set((category ?? '').trim());
    this.loadTechniques();
  }

  protected createTechnique(): void {
    if (!this.techniqueForm.valid) {
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.techniqueForm.value;

    const techData: FarmingTechniqueIn = {
      title: formValue.title || '',
      description: formValue.description || '',
      category: formValue.category || '',
      crop_type: formValue.crop_type || undefined,
    };

    this.expertService.createTechnique(techData, this.isFeatured())
      .pipe(
        catchError(error => {
          this.snackBar.open('Error creating technique', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(technique => {
        if (technique) {
          this.snackBar.open('Technique published successfully!', 'Close', { duration: 2000 });
          this.techniqueForm.reset();
          this.isFeatured.set(false);
          this.loadTechniques();
        }
        this.isSubmitting.set(false);
      });
  }

  protected editTechnique(technique: FarmingTechnique): void {
    this.techniqueForm.patchValue({
      title: technique.title,
      description: technique.description,
      category: technique.category,
      crop_type: technique.crop_type,
    });
    this.isFeatured.set(technique.is_featured);
  }

  protected toggleFeatured(technique: FarmingTechnique): void {
    this.expertService.updateTechnique(
      technique.id,
      {
        title: technique.title,
        description: technique.description,
        category: technique.category,
        crop_type: technique.crop_type ?? undefined,
      },
      !technique.is_featured
    )
      .pipe(
        catchError(error => {
          this.snackBar.open('Error updating technique', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(updated => {
        if (updated) {
          this.snackBar.open(
            `Technique ${updated.is_featured ? 'featured' : 'unfeatured'}`,
            'Close',
            { duration: 2000 }
          );
          this.loadTechniques();
        }
      });
  }

  protected deleteTechnique(techniqueId: number): void {
    if (!confirm('Are you sure you want to delete this technique?')) {
      return;
    }

    this.expertService.deleteTechnique(techniqueId)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error deleting technique', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.snackBar.open('Technique deleted', 'Close', { duration: 2000 });
          this.loadTechniques();
        }
      });
  }

  protected getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      soil: '🌍',
      irrigation: '💧',
      pest: '🐛',
      fertilizer: '🌱',
      harvesting: '🌾',
      seed: '🌰',
      weather: '☀️',
      disease: '🦠',
    };
    return icons[category] || '📌';
  }
}
