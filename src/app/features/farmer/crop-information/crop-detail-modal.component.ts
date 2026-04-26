import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { CropInfo } from '../../../shared/models/crop-info.model';

@Component({
  selector: 'app-crop-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './crop-detail-modal.html',
  styleUrl: './crop-detail-modal.scss',
})
export class CropDetailModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public crop: CropInfo) {}

  /**
   * Convert newline-separated text to array for better display
   */
  getLines(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  /**
   * Get color class for crop type
   */
  getCropTypeColor(cropType: string): string {
    const colors: Record<string, string> = {
      Fruit: 'fruit-header',
      Vegetable: 'vegetable-header',
      Grain: 'grain-header',
      'Cash Crop': 'cash-crop-header',
    };
    return colors[cropType] || 'default-header';
  }

  /**
   * Get icon for crop type
   */
  getCropTypeIcon(cropType: string): string {
    const icons: Record<string, string> = {
      Fruit: 'apple',
      Vegetable: 'eco',
      Grain: 'grain',
      'Cash Crop': 'attach_money',
    };
    return icons[cropType] || 'leaf';
  }
}
