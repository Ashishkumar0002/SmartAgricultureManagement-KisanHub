import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Crop, CropPayload } from '../../shared/models/crop.model';

@Injectable({
  providedIn: 'root',
})
export class CropService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getCrops() {
    return this.http.get<Crop[]>(`${this.baseUrl}/crops`);
  }

  addCrop(payload: CropPayload) {
    return this.http.post<Crop>(`${this.baseUrl}/crops`, payload);
  }
}
