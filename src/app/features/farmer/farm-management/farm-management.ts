import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { FarmerService } from '../../../core/services/farmer.service';
import { Farmer } from '../../../shared/models/farm.model';

@Component({
  selector: 'app-farm-management',
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  templateUrl: './farm-management.html',
  styleUrl: './farm-management.scss',
})
export class FarmManagement {
  private readonly fb = new FormBuilder();
  protected readonly displayedColumns = ['name', 'location', 'total_land', 'phone', 'actions'];
  protected farmers: Farmer[] = [];
  protected editingId: number | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    location: ['', Validators.required],
    total_land: [0, [Validators.required, Validators.min(0.1)]],
    phone: [''],
  });

  constructor(
    private readonly farmerService: FarmerService,
    private readonly snackBar: MatSnackBar
  ) {
    this.loadFarmers();
  }

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const request = this.editingId
      ? this.farmerService.updateFarmer(this.editingId, payload)
      : this.farmerService.addFarmer(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(this.editingId ? 'Farm updated' : 'Farm added', 'Close', { duration: 2200 });
        this.cancelEdit();
        this.loadFarmers();
      },
      error: () => this.snackBar.open('Unable to save farm details', 'Close', { duration: 2600 }),
    });
  }

  protected startEdit(farmer: Farmer) {
    this.editingId = farmer.id;
    this.form.patchValue(farmer);
  }

  protected cancelEdit() {
    this.editingId = null;
    this.form.reset({ name: '', location: '', total_land: 0, phone: '' });
  }

  protected remove(id: number) {
    this.farmerService.deleteFarmer(id).subscribe({
      next: () => {
        this.snackBar.open('Farm deleted', 'Close', { duration: 2200 });
        this.loadFarmers();
      },
      error: () => this.snackBar.open('Delete failed', 'Close', { duration: 2600 }),
    });
  }

  private loadFarmers() {
    this.farmerService.getFarmers().subscribe({
      next: (res) => (this.farmers = res),
      error: () => (this.farmers = []),
    });
  }
}
