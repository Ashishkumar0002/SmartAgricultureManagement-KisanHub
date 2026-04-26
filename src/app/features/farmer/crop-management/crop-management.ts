import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { CropService } from '../../../core/services/crop.service';
import { Crop } from '../../../shared/models/crop.model';

@Component({
  selector: 'app-crop-management',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  templateUrl: './crop-management.html',
  styleUrl: './crop-management.scss',
})
export class CropManagement {
  private readonly fb = new FormBuilder();
  protected crops: Crop[] = [];
  protected readonly displayedColumns = ['name', 'season', 'area'];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    season: ['', Validators.required],
    area: [0, [Validators.required, Validators.min(0.1)]],
    farmer_id: [undefined as number | undefined],
  });

  constructor(
    private readonly cropService: CropService,
    private readonly snackBar: MatSnackBar
  ) {
    this.loadCrops();
  }

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cropService.addCrop(this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Crop added', 'Close', { duration: 2200 });
        this.form.reset({ name: '', season: '', area: 0, farmer_id: undefined });
        this.loadCrops();
      },
      error: () => this.snackBar.open('Unable to add crop', 'Close', { duration: 2600 }),
    });
  }

  private loadCrops() {
    this.cropService.getCrops().subscribe({
      next: (res) => (this.crops = res),
      error: () => (this.crops = []),
    });
  }
}
