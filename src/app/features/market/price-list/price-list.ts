import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

import { MarketPrice, MarketService } from '../../../core/services/market.service';

@Component({
  selector: 'app-price-list',
  imports: [MatCardModule, MatTableModule],
  templateUrl: './price-list.html',
  styleUrl: './price-list.scss',
})
export class PriceList {
  protected readonly displayedColumns = ['crop_name', 'price', 'market_name', 'updated_at'];
  protected prices: MarketPrice[] = [];

  constructor(private readonly marketService: MarketService) {
    this.marketService.getPrices().subscribe({
      next: (res) => (this.prices = res),
      error: () => (this.prices = []),
    });
  }
}
