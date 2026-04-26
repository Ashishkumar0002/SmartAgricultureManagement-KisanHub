import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface MarketPrice {
  id: number;
  crop_name: string;
  price: number;
  market_name: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MarketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getPrices() {
    return this.http.get<MarketPrice[]>(`${this.baseUrl}/market/prices`);
  }

  sellProduct(payload: { crop_id: number; quantity: number; expected_price: number }) {
    return this.http.post(`${this.baseUrl}/market/sell`, payload);
  }
}
