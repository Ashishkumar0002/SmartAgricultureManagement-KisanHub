import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { CropInfo } from '../../shared/models/crop-info.model';

@Injectable({
  providedIn: 'root',
})
export class CropInfoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get all crop information with optional search and filtering
   */
  getAllCropInfo(search?: string, cropType?: string) {
    let url = `${this.baseUrl}/crops-info`;
    const params = [];

    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    if (cropType) {
      params.push(`crop_type=${encodeURIComponent(cropType)}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<CropInfo[]>(url);
  }

  /**
   * Get detailed information for a specific crop by ID
   */
  getCropInfoById(cropInfoId: number) {
    return this.http.get<CropInfo>(`${this.baseUrl}/crops-info/${cropInfoId}`);
  }

  /**
   * Get crop information by crop name
   */
  getCropInfoByName(cropName: string) {
    return this.http.get<CropInfo>(
      `${this.baseUrl}/crops-info/search/by-name/${encodeURIComponent(cropName)}`
    );
  }

  /**
   * Get list of unique crop types for filtering
   */
  getCropTypes(allCrops: CropInfo[]): string[] {
    const types = new Set(allCrops.map((crop) => crop.crop_type));
    return Array.from(types).sort();
  }
}
