import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface WorkerAvailableJob {
  id: number;
  title: string;
  description: string;
  location: string;
  wage: number;
  farmer_name: string;
  posted_date: string;
}

export interface WorkerMyJob {
  application_id: number;
  job_id: number;
  job_title: string;
  farmer_name: string;
  status: 'applied' | 'accepted' | 'rejected' | 'working';
  applied_at: string;
  started_at: string | null;
}

export interface WorkerProfile {
  id: number;
  user_id: number | null;
  name: string;
  contact: string;
  location: string | null;
  skills: string | null;
  experience: string | null;
  availability_status: 'available' | 'working' | 'looking_for_work';
  profile_image: string | null;
  bio: string | null;
  assigned_job_id: number | null;
  created_at: string;
}

export interface WorkerProfilePayload {
  name: string;
  contact: string;
  location: string | null;
  skills: string | null;
  experience: string | null;
  availability_status: 'available' | 'working' | 'looking_for_work';
  profile_image: string | null;
  bio: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class WorkerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/employment/worker`;

  getAvailableJobs(location?: string, skill?: string): Observable<WorkerAvailableJob[]> {
    let params = new HttpParams();
    if (location) {
      params = params.set('location', location);
    }
    if (skill) {
      params = params.set('skill', skill);
    }
    return this.http.get<WorkerAvailableJob[]>(`${this.baseUrl}/jobs`, { params });
  }

  applyForJob(jobId: number, message?: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/jobs/${jobId}/apply`, {
      message: (message ?? '').trim() || null,
    });
  }

  getMyJobs(): Observable<WorkerMyJob[]> {
    return this.http.get<WorkerMyJob[]>(`${this.baseUrl}/my-jobs`);
  }

  getProfile(): Observable<WorkerProfile> {
    return this.http.get<WorkerProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(payload: WorkerProfilePayload): Observable<WorkerProfile> {
    return this.http.put<WorkerProfile>(`${this.baseUrl}/profile`, payload);
  }
}
