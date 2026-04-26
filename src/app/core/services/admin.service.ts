import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

// Admin Models
export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  status?: string;
  region?: string | null;
  last_active?: string | null;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalFarmers: number;
  activeCrops: number;
  dau: number;
  userGrowthData: Array<{ date: string; count: number }>;
  cropDistribution: Array<{ cropType?: string; name: string; count: number }>;
  featureUsage: Array<{ feature: string; count: number }>;
  featureUsageCounts?: {
    alertsCount: number;
    equipmentBookingsCount: number;
    techniquesCount: number;
  };
}

export interface FarmingInsights {
  topCrops: Array<{ name: string; count: number }>;
  mostUsedTechniques: Array<{ name: string; count: number }>;
  regionWiseFarmers: Array<{ region: string; count: number }>;
}

export interface AdvancedAnalytics {
  dau: number;
  mau: number;
  retentionRate: number;
  featureUsage: Array<{ feature: string; count: number }>;
}

export interface AdminAlert {
  id: number;
  expert_id: number;
  title: string;
  description: string;
  message?: string | null;
  status: string;
  alert_type: string;
  severity: string;
  target_regions: string;
  affected_crops?: string | null;
  recommendations?: string | null;
  created_at: string;
}

export interface EquipmentAnalytics {
  totalListings: number;
  totalBookings: number;
  activeBookings: number;
  mostRentedEquipment: Array<{ name: string; count: number }>;
}

export interface FarmImageRecord {
  id: number;
  user_id: number;
  image_url: string;
  crop_type?: string | null;
  uploaded_at: string;
}

export interface SystemHealth {
  status: string;
  serverTime: string;
  uptime: number;
  totalErrors: number;
  apiStatus?: string;
  databaseStatus?: string;
  recentErrorCount?: number;
}

export interface ExpertAssignment {
  id: number;
  advisory_id: number;
  expert_id: number;
  assigned_by: number;
  status: string;
  assignment_date: string;
  completion_date: string | null;
}

export interface Content {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string | null;
  metadata: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  description: string;
  daily_rent: number;
  location: string;
  owner_id: number;
  is_available: boolean;
  condition: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  ip_address: string | null;
  timestamp: string;
}

export interface SystemAnalytics {
  total_users: number;
  total_farmers: number;
  total_experts: number;
  total_advisories: number;
  pending_advisories: number;
  avg_expert_response_time_hours: number;
  avg_farmer_satisfaction: number;
  active_advisories: number;
}

export interface AdminStats {
  total_farmers: number;
  total_experts: number;
  total_jobs: number;
  total_equipment: number;
  approved_equipment: number;
  pending_equipment: number;
}

export interface EmploymentJob {
  id: number;
  farmer_id: number;
  farmer_name: string;
  title: string;
  description: string;
  location: string;
  wage: number;
  duration?: string | null;
  status: 'open' | 'active' | 'closed' | string;
  created_at: string;
}

export interface EmploymentApplication {
  id: number;
  job_id: number;
  job_title: string;
  applicant_id: number;
  applicant_name: string;
  applicant_email: string;
  farmer_name: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | string;
  created_at: string;
}

export interface EmploymentWorker {
  id: number;
  name: string;
  contact: string;
  experience: string | null;
  is_blocked: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  // ====================
  // USER MANAGEMENT
  // ====================

  getAllUsers(filters?: { role?: string; region?: string; status?: string }) {
    let params = new HttpParams();
    if (filters?.role) {
      params = params.set('role', filters.role);
    }
    if (filters?.region) {
      params = params.set('region', filters.region);
    }
    if (filters?.status) {
      params = params.set('status_filter', filters.status);
    }
    return this.http.get<AdminUser[]>(`${this.baseUrl}/users`, { params });
  }

  getUsersByRole(role: string) {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/users/role/${role}`);
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.baseUrl}/users/${userId}`);
  }

  updateUserStatus(userId: number, status: 'active' | 'suspended') {
    return this.http.patch<{ id: number; status: string }>(`${this.baseUrl}/users/${userId}/status`, { status });
  }

  getUserActivity(userId: number, limit: number = 50) {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<ActivityLog[]>(`${this.baseUrl}/users/${userId}/activity`, { params });
  }

  getDashboardStats() {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard-stats`);
  }

  getFarmingInsights() {
    return this.http.get<FarmingInsights>(`${this.baseUrl}/farming-insights`);
  }

  getAdvancedAnalytics() {
    return this.http.get<AdvancedAnalytics>(`${this.baseUrl}/analytics`);
  }

  createAlert(payload: {
    expert_id: number;
    title: string;
    description: string;
    message?: string;
    alert_type: string;
    severity?: string;
    target_regions: string;
    affected_crops?: string;
    recommendations?: string;
    expiry_date?: string;
  }) {
    return this.http.post<AdminAlert>(`${this.baseUrl}/alerts`, payload);
  }

  approveAlert(alertId: number) {
    return this.http.patch<AdminAlert>(`${this.baseUrl}/alerts/${alertId}/approve`, {});
  }

  getAlerts(status?: string) {
    let params = new HttpParams();
    if (status) {
      params = params.set('status_filter', status);
    }
    return this.http.get<AdminAlert[]>(`${this.baseUrl}/alerts`, { params });
  }

  getEquipmentAnalytics() {
    return this.http.get<EquipmentAnalytics>(`${this.baseUrl}/equipment/analytics`);
  }

  getFarmImages(userId?: number, limit: number = 100) {
    let params = new HttpParams().set('limit', String(limit));
    if (userId !== undefined) {
      params = params.set('user_id', String(userId));
    }
    return this.http.get<FarmImageRecord[]>(`${this.baseUrl}/farm-images`, { params });
  }

  getLogs(level?: string, days: number = 7, limit: number = 200) {
    let params = new HttpParams().set('days', String(days)).set('limit', String(limit));
    if (level) {
      params = params.set('level', level);
    }
    return this.http.get<ActivityLog[]>(`${this.baseUrl}/logs`, { params });
  }

  getSystemHealth() {
    return this.http.get<SystemHealth>(`${this.baseUrl}/system-health`);
  }

  // ====================
  // EXPERT ASSIGNMENT
  // ====================

  getExpertAssignments(status?: string) {
    let params = new HttpParams();
    if (status) {
      params = params.set('status_filter', status);
    }
    return this.http.get<ExpertAssignment[]>(`${this.baseUrl}/expert-assignments`, { params });
  }

  createExpertAssignment(advisoryId: number, expertId: number) {
    return this.http.post<ExpertAssignment>(`${this.baseUrl}/expert-assignments`, {
      advisory_id: advisoryId,
      expert_id: expertId,
    });
  }

  updateExpertAssignment(assignmentId: number, status: string) {
    return this.http.patch<ExpertAssignment>(
      `${this.baseUrl}/expert-assignments/${assignmentId}`,
      null,
      { params: new HttpParams().set('new_status', status) }
    );
  }

  // ====================
  // CONTENT MANAGEMENT
  // ====================

  getContents(category?: string) {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<Content[]>(`${this.baseUrl}/contents`, { params });
  }

  createContent(data: {
    title: string;
    description: string;
    category: string;
    location?: string;
    metadata?: string;
  }) {
    return this.http.post<Content>(`${this.baseUrl}/contents`, data);
  }

  updateContent(
    contentId: number,
    data: {
      title: string;
      description: string;
      category: string;
      location?: string;
      metadata?: string;
    }
  ) {
    return this.http.put<Content>(`${this.baseUrl}/contents/${contentId}`, data);
  }

  deleteContent(contentId: number) {
    return this.http.delete(`${this.baseUrl}/contents/${contentId}`);
  }

  // ====================
  // EQUIPMENT MANAGEMENT
  // ====================

  getEquipment(isAvailable?: boolean) {
    let params = new HttpParams();
    if (isAvailable !== undefined) {
      params = params.set('is_available', isAvailable.toString());
    }
    return this.http.get<Equipment[]>(`${this.baseUrl}/equipment`, { params });
  }

  createEquipment(
    data: {
      name: string;
      description: string;
      daily_rent: number;
      location: string;
      condition?: string;
    },
    ownerId: number
  ) {
    const params = new HttpParams().set('owner_id', ownerId.toString());
    return this.http.post<Equipment>(`${this.baseUrl}/equipment`, data, { params });
  }

  // ====================
  // ACTIVITY MONITORING
  // ====================

  getActivities(userId?: number, action?: string, days: number = 7) {
    let params = new HttpParams().set('days', days.toString());
    if (userId) {
      params = params.set('user_id', userId.toString());
    }
    if (action) {
      params = params.set('action', action);
    }
    return this.http.get<ActivityLog[]>(`${this.baseUrl}/activities`, { params });
  }

  // ====================
  // ANALYTICS
  // ====================

  getSystemAnalytics() {
    return this.http.get<SystemAnalytics>(`${this.baseUrl}/analytics/system`);
  }

  getAdminStats() {
    return this.http.get<AdminStats>(`${this.baseUrl}/analytics/stats`);
  }

  // ====================
  // EMPLOYMENT / LABOR MANAGEMENT
  // ====================

  getEmploymentJobs(status?: string) {
    let params = new HttpParams();
    if (status) {
      params = params.set('status_filter', status);
    }
    return this.http.get<EmploymentJob[]>(`${this.baseUrl}/jobs`, { params });
  }

  getEmploymentApplications(status?: string) {
    let params = new HttpParams();
    if (status) {
      params = params.set('status_filter', status);
    }
    return this.http.get<EmploymentApplication[]>(`${this.baseUrl}/applications`, { params });
  }

  updateEmploymentApplicationStatus(applicationId: number, status: 'accepted' | 'rejected') {
    return this.http.put<EmploymentApplication>(`${this.baseUrl}/applications/${applicationId}/status`, { status });
  }

  getEmploymentWorkers(blocked?: boolean) {
    let params = new HttpParams();
    if (blocked !== undefined) {
      params = params.set('blocked', blocked.toString());
    }
    return this.http.get<EmploymentWorker[]>(`${this.baseUrl}/workers`, { params });
  }

  removeOrBlockWorker(workerId: number, hardDelete: boolean = false) {
    const params = new HttpParams().set('hard_delete', hardDelete.toString());
    return this.http.delete(`${this.baseUrl}/workers/${workerId}`, { params });
  }
}
