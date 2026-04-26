import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ============================================
// INTERFACES
// ============================================

export interface ExpertProfile {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  specialization: string;
  bio: string | null;
  profile_image: string | null;
  phone: string | null;
  years_of_experience: number;
  achievements: string | null;
  research_work: string | null;
  rating: number;
  total_queries_resolved: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ExpertIn {
  specialization: string;
  bio: string | null;
  years_of_experience: number;
  achievements: string | null;
  research_work: string | null;
}

export interface AdvisoryImage {
  id: number;
  advisory_id: number;
  image_path: string;
  uploaded_at: Date;
}

export interface AdvisoryMessage {
  id: number;
  advisory_id: number;
  message: string;
  sender_id: number;
  is_from_expert: boolean;
  created_at: Date;
}

export interface ExpertQuery {
  id: number;
  question: string;
  response: string | null;
  farmer_id: number | null;
  farmer_name: string | null;
  farmer_location: string | null;
  farmer_soil_type: string | null;
  farmer_crop_variety: string | null;
  farmer_profile_image: string | null;
  expert_id: number | null;
  status: string;
  created_at: Date;
  images?: AdvisoryImage[];
  messages?: AdvisoryMessage[];
}

export interface ExpertQueryDetail {
  id: number;
  question: string;
  response: string | null;
  farmer_id: number | null;
  farmer_name: string | null;
  farmer_location: string | null;
  farmer_soil_type: string | null;
  farmer_crop_variety: string | null;
  expert_id: number | null;
  status: string;
  created_at: Date;
  images: AdvisoryImage[];
  messages: AdvisoryMessage[];
}

export interface Alert {
  id: number;
  expert_id: number;
  title: string;
  description: string;
  alert_type: string;
  severity: string;
  target_regions: string;
  affected_crops: string | null;
  recommendations: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  expiry_date: Date | null;
}

export interface AlertIn {
  title: string;
  description: string;
  alert_type: string;
  severity?: string;
  target_regions: string;
  affected_crops?: string;
  recommendations?: string;
  expiry_date?: Date;
}

export interface FarmingTechnique {
  id: number;
  title: string;
  description: string;
  category: string;
  crop_type: string | null;
  expert_id: number;
  featured_image: string | null;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FarmingTechniqueIn {
  title: string;
  description: string;
  category: string;
  crop_type?: string;
}

export interface ExpertDashboardStats {
  total_assigned_queries: number;
  pending_queries: number;
  resolved_queries: number;
  alerts_sent: number;
  active_alerts: number;
  avg_response_time_hours: number;
  farmer_satisfaction_rating: number;
}

export interface GenerateAiResponsePayload {
  query: string;
  crop?: string;
  soil?: string;
  location?: string;
  regenerate?: boolean;
}

export interface GenerateAiResponseResult {
  success: boolean;
  aiResponse: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpertService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/expert`;
  private aiBaseUrl = `${environment.apiUrl}/api/ai`;

  // ============================================
  // EXPERT PROFILE METHODS
  // ============================================

  getExpertProfile(): Observable<ExpertProfile> {
    return this.http.get<ExpertProfile>(`${this.baseUrl}/profile`)
      .pipe(catchError(error => {
        console.error('Error fetching expert profile:', error);
        return throwError(() => error);
      }));
  }

  updateExpertProfile(profile: ExpertIn): Observable<ExpertProfile> {
    return this.http.put<ExpertProfile>(`${this.baseUrl}/profile`, profile)
      .pipe(catchError(error => {
        console.error('Error updating expert profile:', error);
        return throwError(() => error);
      }));
  }

  uploadProfileImage(file: File): Observable<{ profile_image: string }> {
    const payload = new FormData();
    payload.append('file', file);

    return this.http.post<{ profile_image: string }>(`${this.baseUrl}/profile/photo`, payload)
      .pipe(catchError(error => {
        console.error('Error uploading profile image:', error);
        return throwError(() => error);
      }));
  }

  // ============================================
  // QUERY MANAGEMENT METHODS
  // ============================================

  getAssignedQueries(
    statusFilter?: string,
    limit: number = 50,
    offset: number = 0
  ): Observable<ExpertQuery[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (statusFilter) {
      params = params.set('status_filter', statusFilter);
    }

    return this.http.get<ExpertQuery[]>(`${this.baseUrl}/queries`, { params })
      .pipe(catchError(error => {
        console.error('Error fetching queries:', error);
        return throwError(() => error);
      }));
  }

  getQueryDetail(queryId: number): Observable<ExpertQueryDetail> {
    return this.http.get<ExpertQueryDetail>(`${this.baseUrl}/queries/${queryId}`)
      .pipe(catchError(error => {
        console.error('Error fetching query detail:', error);
        return throwError(() => error);
      }));
  }

  updateQueryStatus(
    queryId: number,
    newStatus: string,
    response?: string
  ): Observable<ExpertQuery> {
    const params = new HttpParams().set('new_status', newStatus);
    const body = response ? { response } : {};

    return this.http.put<ExpertQuery>(
      `${this.baseUrl}/queries/${queryId}/status`,
      body,
      { params }
    ).pipe(catchError(error => {
      console.error('Error updating query status:', error);
      return throwError(() => error);
    }));
  }

  sendMessageToQuery(queryId: number, message: string): Observable<AdvisoryMessage> {
    const body = { advisory_id: queryId, message };

    return this.http.post<AdvisoryMessage>(
      `${this.baseUrl}/queries/${queryId}/message`,
      body
    ).pipe(catchError(error => {
      console.error('Error sending message:', error);
      return throwError(() => error);
    }));
  }

  getQueryMessages(queryId: number): Observable<AdvisoryMessage[]> {
    return this.http.get<AdvisoryMessage[]>(`${this.baseUrl}/queries/${queryId}/messages`)
      .pipe(catchError(error => {
        console.error('Error fetching messages:', error);
        return throwError(() => error);
      }));
  }

  generateAiResponse(payload: GenerateAiResponsePayload): Observable<GenerateAiResponseResult> {
    return this.http.post<GenerateAiResponseResult>(`${this.aiBaseUrl}/generate-response`, payload)
      .pipe(catchError(error => {
        console.error('Error generating AI response:', error);
        return throwError(() => error);
      }));
  }

  // ============================================
  // ALERT MANAGEMENT METHODS
  // ============================================

  getExpertAlerts(
    activeOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Observable<Alert[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('active_only', activeOnly.toString());

    return this.http.get<Alert[]>(`${this.baseUrl}/alerts`, { params })
      .pipe(catchError(error => {
        console.error('Error fetching alerts:', error);
        return throwError(() => error);
      }));
  }

  createAlert(alert: AlertIn): Observable<Alert> {
    return this.http.post<Alert>(`${this.baseUrl}/alerts`, alert)
      .pipe(catchError(error => {
        console.error('Error creating alert:', error);
        return throwError(() => error);
      }));
  }

  updateAlert(alertId: number, alert: AlertIn): Observable<Alert> {
    return this.http.put<Alert>(`${this.baseUrl}/alerts/${alertId}`, alert)
      .pipe(catchError(error => {
        console.error('Error updating alert:', error);
        return throwError(() => error);
      }));
  }

  deactivateAlert(alertId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/alerts/${alertId}`)
      .pipe(catchError(error => {
        console.error('Error deactivating alert:', error);
        return throwError(() => error);
      }));
  }

  // ============================================
  // FARMING TECHNIQUES METHODS
  // ============================================

  getExpertTechniques(
    category?: string,
    limit: number = 50,
    offset: number = 0
  ): Observable<FarmingTechnique[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<FarmingTechnique[]>(`${this.baseUrl}/techniques`, { params })
      .pipe(catchError(error => {
        console.error('Error fetching techniques:', error);
        return throwError(() => error);
      }));
  }

  createTechnique(
    technique: FarmingTechniqueIn,
    isFeatured: boolean = false
  ): Observable<FarmingTechnique> {
    const params = new HttpParams().set('is_featured', isFeatured.toString());

    return this.http.post<FarmingTechnique>(
      `${this.baseUrl}/techniques`,
      technique,
      { params }
    ).pipe(catchError(error => {
      console.error('Error creating technique:', error);
      return throwError(() => error);
    }));
  }

  updateTechnique(
    techniqueId: number,
    technique: FarmingTechniqueIn,
    isFeatured?: boolean
  ): Observable<FarmingTechnique> {
    let params = new HttpParams();
    if (isFeatured !== undefined) {
      params = params.set('is_featured', isFeatured.toString());
    }

    return this.http.put<FarmingTechnique>(
      `${this.baseUrl}/techniques/${techniqueId}`,
      technique,
      { params }
    ).pipe(catchError(error => {
      console.error('Error updating technique:', error);
      return throwError(() => error);
    }));
  }

  deleteTechnique(techniqueId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/techniques/${techniqueId}`
    ).pipe(catchError(error => {
      console.error('Error deleting technique:', error);
      return throwError(() => error);
    }));
  }

  // ============================================
  // DASHBOARD STATISTICS
  // ============================================

  getDashboardStats(): Observable<ExpertDashboardStats> {
    return this.http.get<ExpertDashboardStats>(`${this.baseUrl}/dashboard-stats`)
      .pipe(catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        return throwError(() => error);
      }));
  }
}
