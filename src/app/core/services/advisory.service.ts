import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Advisory, AdvisoryMessage, AdvisoryPayload } from '../../shared/models/advisory.model';

@Injectable({
  providedIn: 'root',
})
export class AdvisoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getAdvisories() {
    return this.http.get<Advisory[]>(`${this.baseUrl}/advisory`);
  }

  getFarmerAdvisories() {
    return this.http.get<Advisory[]>(`${this.baseUrl}/farmer/advisory`);
  }

  getAdvisoryMessages(advisoryId: number) {
    return this.http.get<AdvisoryMessage[]>(`${this.baseUrl}/farmer/advisory/${advisoryId}/messages`);
  }

  askExpert(payload: AdvisoryPayload) {
    return this.http.post<Advisory>(`${this.baseUrl}/advisory`, payload);
  }
}
