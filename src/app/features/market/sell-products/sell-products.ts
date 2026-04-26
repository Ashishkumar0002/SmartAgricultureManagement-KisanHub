import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MarketService } from '../../../core/services/market.service';

@Component({
  selector: 'app-sell-products',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './sell-products.html',
  styleUrl: './sell-products.scss',
})
export class SellProducts {
  private readonly fb = new FormBuilder();
  protected readonly form = this.fb.nonNullable.group({
    crop_id: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    expected_price: [0, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private readonly marketService: MarketService,
    private readonly snackBar: MatSnackBar
  ) {}

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.marketService.sellProduct(this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Product listing submitted', 'Close', { duration: 2300 });
        this.form.reset({ crop_id: 0, quantity: 0, expected_price: 0 });
      },
      error: () => this.snackBar.open('Unable to submit listing', 'Close', { duration: 2800 }),
    });
  }
}
