import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { CropInfoService } from '../../../core/services/crop-info.service';
import { CropInfo, CropType } from '../../../shared/models/crop-info.model';
import { CropDetailModalComponent } from './crop-detail-modal.component';

@Component({
  selector: 'app-crop-information',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './crop-information.html',
  styleUrl: './crop-information.scss',
})
export class CropInformationComponent implements OnInit {
  private readonly cropInfoService = inject(CropInfoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected allCrops: CropInfo[] = [];
  protected filteredCrops: CropInfo[] = [];
  protected cropTypes: string[] = [];
  protected isLoading = false;

  protected searchControl = this.fb.control('');
  protected cropTypeControl = this.fb.control('');

  ngOnInit() {
    this.loadAllCrops();
    this.setupFilterListeners();
  }

  /**
   * Load all crop information from backend
   */
  private loadAllCrops() {
    this.isLoading = true;
    this.cropInfoService.getAllCropInfo().subscribe({
      next: (crops) => {
        this.allCrops = crops;
        this.filteredCrops = crops;
        this.cropTypes = this.cropInfoService.getCropTypes(crops);
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load crop information', 'Close', {
          duration: 2600,
        });
        this.isLoading = false;
      },
    });
  }

  /**
   * Setup listeners for search and filter controls
   */
  private setupFilterListeners() {
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.cropTypeControl.valueChanges.subscribe(() => this.applyFilters());
  }

  /**
   * Apply search and filter to crops
   */
  protected applyFilters() {
    const search = (this.searchControl.value || '').toLowerCase();
    const cropType = this.cropTypeControl.value || '';

    this.filteredCrops = this.allCrops.filter((crop) => {
      const matchesSearch =
        search === '' ||
        crop.name.toLowerCase().includes(search) ||
        crop.crop_type.toLowerCase().includes(search);

      const matchesType = cropType === '' || crop.crop_type === cropType;

      return matchesSearch && matchesType;
    });
  }

  /**
   * Reset all filters and search
   */
  protected resetFilters() {
    this.searchControl.setValue('');
    this.cropTypeControl.setValue('');
    this.applyFilters();
  }

  /**
   * Open crop detail modal for selected crop
   */
  protected openCropDetails(crop: CropInfo) {
    this.dialog.open(CropDetailModalComponent, {
      data: crop,
      width: '90%',
      maxWidth: '1000px',
      panelClass: 'crop-detail-dialog',
    });
  }

  /**
   * Get display text for crop type with icon
   */
  protected getCropTypeIcon(cropType: string): string {
    const icons: Record<string, string> = {
      Fruit: 'apple',
      Vegetable: 'eco',
      Grain: 'grain',
      'Cash Crop': 'attach_money',
    };
    return icons[cropType] || 'leaf';
  }

  /**
   * Get color class for crop type badge
   */
  protected getCropTypeColor(cropType: string): string {
    const colors: Record<string, string> = {
      Fruit: 'fruit-badge',
      Vegetable: 'vegetable-badge',
      Grain: 'grain-badge',
      'Cash Crop': 'cash-crop-badge',
    };
    return colors[cropType] || 'default-badge';
  }
}
