import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Farmer, FarmerPayload } from '../../shared/models/farm.model';

// ==================== INTERFACES ====================

export interface SoilProfile {
  type: string | null;
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  moisture: number | null;
  health_status: string | null;
}

export interface CropPlanning {
  current_crop: string | null;
  previous_crop: string | null;
  season: string | null;
  sowing_date: string | null;
  harvest_date: string | null;
  duration_days: number | null;
}

export interface FarmAnalytics {
  yield_kg: number | null;
  cost: number | null;
  revenue: number | null;
  profit: number | null;
}

export interface FarmAssets {
  equipment: string[];
  livestock: number | null;
  storage: number | null;
  workers: number | null;
}

export interface FarmerProfile {
  id: number;
  user_id: number;
  name: string;
  location: string;
  total_land: number;
  soil_type: string | null;
  crop_variety: string | null;
  irrigation_type: string | null;
  phone: string | null;
  profile_image: string | null;
  farm_image: string | null;
  soil: SoilProfile | null;
  crop_planning: CropPlanning | null;
  analytics: FarmAnalytics | null;
  assets: FarmAssets | null;
  alerts: FarmerAlert[];
  created_at: string;
  updated_at: string;
}

export interface Crop {
  id: number;
  name: string;
  season: string;
  area: number;
  farmer_id: number | null;
}

export interface MarketPrice {
  id: number;
  crop_name: string;
  price: number;
  market_name: string;
  updated_at: string;
}

export interface MarketNews {
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source_name: string | null;
  published_at: string | null;
}

export interface GovernmentScheme {
  scheme_name: string;
  ministry: string | null;
  state: string | null;
  description: string | null;
  source_url: string | null;
}

export interface FarmerAlert {
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
  created_at: string;
  updated_at: string;
  expiry_date: string | null;
}

export interface Weather {
  location: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  rainfall: number;
  wind_speed: number;
  solar_radiation: number;
  soil_temperature_0cm: number;
  soil_moisture_0_1cm: number;
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
  }>;
  updated_at: string;
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    admin1?: string;
    country?: string;
  }>;
}

interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    shortwave_radiation?: number;
    soil_temperature_0cm?: number;
    soil_moisture_0_1cm?: number;
    time: string;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    weathercode?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
}

interface DataGovMarketResponse {
  records?: Array<{
    commodity?: string;
    modal_price?: string | number;
    market?: string;
    district?: string;
    state?: string;
    arrival_date?: string;
  }>;
}

export interface Advisory {
  id: number;
  question: string;
  response: string | null;
  farmer_id: number | null;
  expert_id: number | null;
  status: string;
  created_at: string;
}

export interface AdvisoryDetail extends Advisory {
  images: AdvisoryImage[];
  messages: AdvisoryMessage[];
}

export interface AdvisoryImage {
  id: number;
  advisory_id: number;
  image_path: string;
  uploaded_at: string;
}

export interface AdvisoryMessage {
  id: number;
  advisory_id: number;
  sender_id: number;
  message: string;
  is_from_expert: boolean;
  created_at: string;
}

export interface Job {
  id: number;
  farmer_id: number;
  farmer_name?: string;
  title: string;
  description: string;
  location: string;
  wage: number;
  duration?: string | null;
  status: 'open' | 'active' | 'closed';
  created_at: string;
}

export interface Worker {
  id: number;
  name: string;
  contact: string;
  experience: string | null;
  skills: string | null;
  location: string | null;
  availability_status: 'available' | 'looking_for_work' | 'busy';
  assigned_job_id: number | null;
  is_blocked: boolean;
  created_at: string;
}

export interface Application {
  id: number;
  job_id: number;
  applicant_id: number;
  message?: string | null;
  status: string;
  created_at: string;
}

export interface ApplicationDetail extends Application {
  applicant_name?: string;
  applicant_email?: string;
  job_title?: string;
  farmer_name?: string;
  location?: string;
  wage?: number;
  duration?: string | null;
}

export interface FarmerJobApplication {
  id: number;
  job_id: number;
  job_title: string;
  job_location: string;
  wage: number;
  job_status: string;
  applicant_id: number;
  applicant_name: string;
  experience: string | null;
  skills: string | null;
  contact_number: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  daily_rent: number;
  location: string;
  is_available: boolean;
  condition: string;
  created_at: string;
}

export interface EquipmentBooking {
  id: number;
  equipment_id: number;
  farmer_id: number;
  start_date: string;
  end_date: string;
  total_cost: number;
  status: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface CropGuide {
  id: number;
  crop_name: string;
  growth_duration_days: number;
  water_requirements: string;
  climate_conditions: string;
  fertilizer_usage: string;
  common_diseases: string;
  prevention_methods: string;
  best_season: string;
  avg_yield_per_hectare: number;
  created_at: string;
  updated_at: string;
}

export interface CropFertilizer {
  nitrogen: string;
  phosphorus: string;
  potassium: string;
}

export interface CropInformation {
  crop_name: string;
  category: string;
  season: string;
  soil_type: string;
  temperature: string;
  water_requirement: string;
  irrigation: string;
  fertilizer: CropFertilizer;
  sowing_time: string;
  harvest_time: string;
  common_diseases: string[];
  solutions: string[];
  source_url: string | null;
}

export interface FarmerDashboardStats {
  total_land: number;
  active_crops: number;
  pending_requests: number;
  equipment_borrowed: number;
  techniques_saved: number;
  avg_soil_health: number | null;
}

export interface AIAdvisorRequest {
  ph: number;
  n: number;
  p: number;
  k: number;
  moisture: number;
  crop: string;
  location: string;
}

export interface AIAdvisorResponse {
  cropRecommendation: string;
  fertilizer: string;
  irrigation: string;
  warnings: string;
}

export interface AIChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  message: string;
  history: AIChatHistoryItem[];
  language?: string;
}

export interface AIChatResponse {
  reply: string;
}

export interface AIInsightsRequest {
  yield: number;
  cost: number;
  revenue: number;
}

export interface AIInsightsResponse {
  profit: number;
  profitAnalysis: string;
  incomeSuggestions: string;
  costOptimization: string;
}

export interface AISmartAlertsRequest {
  ph?: number;
  moisture?: number;
  crop?: string;
  location?: string;
  weather?: Record<string, unknown>;
}

export interface AISmartAlertsResponse {
  alerts: string[];
}

export interface AIImageAnalysisResponse {
  disease: string;
  cause: string;
  treatment: string;
  prevention: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root',
})
export class FarmerService {
  private apiUrl = `${environment.apiUrl}/farmer`;
  private farmersApiUrl = `${environment.apiUrl}/farmers`;
  private dataGovResourceUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
  private dataGovApiKey = (environment as { dataGovApiKey?: string }).dataGovApiKey ?? 'YOUR_API_KEY';

  constructor(private http: HttpClient) {}

  // ==================== FARMER PROFILE ====================

  getFarmerProfile(): Observable<FarmerProfile> {
    return this.http.get<FarmerProfile>(`${this.apiUrl}/profile`);
  }

  createFarmerProfile(profile: Partial<FarmerProfile>): Observable<FarmerProfile> {
    return this.http.post<FarmerProfile>(`${this.apiUrl}/profile`, profile);
  }

  updateFarmerProfile(profile: Partial<FarmerProfile>): Observable<FarmerProfile> {
    return this.http.put<FarmerProfile>(`${this.apiUrl}/profile`, profile);
  }

  uploadFarmImage(file: File): Observable<{ image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ image_url: string }>(`${this.apiUrl}/upload`, formData);
  }

  // Generic farmer CRUD (used by admin and farm-management screens)
  getFarmers(): Observable<Farmer[]> {
    return this.http.get<Farmer[]>(this.farmersApiUrl);
  }

  addFarmer(payload: FarmerPayload): Observable<Farmer> {
    return this.http.post<Farmer>(this.farmersApiUrl, payload);
  }

  updateFarmer(farmerId: number, payload: FarmerPayload): Observable<Farmer> {
    return this.http.put<Farmer>(`${this.farmersApiUrl}/${farmerId}`, payload);
  }

  deleteFarmer(farmerId: number): Observable<void> {
    return this.http.delete<void>(`${this.farmersApiUrl}/${farmerId}`);
  }

  // ==================== CROPS ====================

  getFarmerCrops(): Observable<Crop[]> {
    return this.http.get<Crop[]>(`${this.apiUrl}/crops`);
  }

  addCrop(crop: Partial<Crop>): Observable<Crop> {
    return this.http.post<Crop>(`${this.apiUrl}/crops`, crop);
  }

  deleteCrop(cropId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/crops/${cropId}`);
  }

  // ==================== MARKET PRICES ====================

  getMarketPrices(cropName?: string, loadAllItems = false): Observable<MarketPrice[]> {
    if (!this.dataGovApiKey || this.dataGovApiKey === 'YOUR_API_KEY') {
      return this.getMarketPricesFromBackend(cropName, loadAllItems);
    }

    return this.getMarketPricesFromDataGov(cropName, loadAllItems).pipe(
      catchError(() => this.getMarketPricesFromBackend(cropName, loadAllItems))
    );
  }

  private getMarketPricesFromBackend(cropName?: string, loadAllItems = false): Observable<MarketPrice[]> {
    let params = new HttpParams();
    if (cropName) {
      params = params.set('crop_name', cropName);
    }
    params = params.set('limit', loadAllItems ? '100' : '50');
    return this.http.get<MarketPrice[]>(`${this.apiUrl}/market-prices`, { params });
  }

  private getMarketPricesFromDataGov(cropName?: string, loadAllItems = false): Observable<MarketPrice[]> {
    let params = new HttpParams()
      .set('api-key', this.dataGovApiKey)
      .set('format', 'json')
      .set('limit', loadAllItems ? '100' : '50')
      .set('offset', '0');

    const normalizedQuery = cropName?.trim().toLowerCase() ?? '';

    return this.http.get<DataGovMarketResponse>(this.dataGovResourceUrl, { params }).pipe(
      map((response) => {
        const records = (response.records ?? []).filter((record) => {
          if (!normalizedQuery) {
            return true;
          }
          const commodity = (record.commodity ?? '').toLowerCase();
          return commodity.includes(normalizedQuery);
        });

        return records.map((record, index) => {
          const marketParts = [record.market, record.district, record.state].filter(Boolean);
          const parsedPrice = Number(record.modal_price ?? 0) / 100;
          return {
            id: index + 1,
            crop_name: record.commodity || 'Unknown Crop',
            price: Number.isFinite(parsedPrice) ? Number(parsedPrice.toFixed(2)) : 0,
            market_name: marketParts.join(', ') || 'Unknown Market',
            updated_at: record.arrival_date || new Date().toISOString(),
          } as MarketPrice;
        });
      })
    );
  }

  // ==================== MARKET NEWS ====================

  getMarketNews(limit = 8): Observable<MarketNews[]> {
    const params = new HttpParams().set('limit', Math.max(3, Math.min(limit, 20)).toString());
    return this.http.get<MarketNews[]>(`${this.apiUrl}/market-news`, { params });
  }

  getGovernmentSchemes(ministry?: string, state?: string, limit = 80): Observable<GovernmentScheme[]> {
    let params = new HttpParams().set('limit', Math.max(10, Math.min(limit, 200)).toString());
    if (ministry?.trim()) {
      params = params.set('ministry', ministry.trim());
    }
    if (state?.trim()) {
      params = params.set('state', state.trim());
    }
    return this.http.get<GovernmentScheme[]>(`${this.apiUrl}/government-schemes`, { params });
  }

  getFarmerAlerts(limit = 25): Observable<FarmerAlert[]> {
    const params = new HttpParams().set('limit', Math.max(1, Math.min(limit, 100)).toString());
    return this.http.get<FarmerAlert[]>(`${this.apiUrl}/alerts`, { params });
  }

  // ==================== WEATHER ====================

  getWeather(location: string): Observable<Weather> {
    let params = new HttpParams().set('location', location);
    return this.http.get<Weather>(`${this.apiUrl}/weather`, { params });
  }

  getOpenMeteoWeatherByCoordinates(latitude: number, longitude: number, locationLabel?: string): Observable<Weather> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,soil_temperature_0cm,soil_moisture_0_1cm,shortwave_radiation')
      .set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum')
      .set('forecast_days', '5')
      .set('timezone', 'auto');

    return this.http
      .get<OpenMeteoForecastResponse>('https://api.open-meteo.com/v1/forecast', { params })
      .pipe(
        map((response) => this.mapOpenMeteoToWeather(response, locationLabel ?? `Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`))
      );
  }

  getOpenMeteoWeatherByLocation(location: string): Observable<Weather> {
    const geocodingParams = new HttpParams()
      .set('name', location)
      .set('count', '1')
      .set('language', 'en')
      .set('format', 'json');

    return this.http
      .get<OpenMeteoGeocodingResponse>('https://geocoding-api.open-meteo.com/v1/search', { params: geocodingParams })
      .pipe(
        switchMap((geo) => {
          const firstResult = geo.results?.[0];
          if (!firstResult) {
            return throwError(() => new Error('Location not found'));
          }

          const labelParts = [firstResult.name, firstResult.admin1, firstResult.country].filter(Boolean);
          const label = labelParts.join(', ');

          return this.getOpenMeteoWeatherByCoordinates(firstResult.latitude, firstResult.longitude, label);
        })
      );
  }

  private mapOpenMeteoToWeather(response: OpenMeteoForecastResponse, locationLabel: string): Weather {
    const dailyTimes = response.daily?.time ?? [];
    const dailyMax = response.daily?.temperature_2m_max ?? [];
    const dailyMin = response.daily?.temperature_2m_min ?? [];
    const dailyCodes = response.daily?.weather_code ?? response.daily?.weathercode ?? [];
    const dailyRain = response.daily?.precipitation_sum ?? [];

    const forecast = dailyTimes.map((date, index) => {
      const maxTemp = dailyMax[index] ?? 0;
      const minTemp = dailyMin[index] ?? 0;
      const avgTemp = Number(((maxTemp + minTemp) / 2).toFixed(1));

      return {
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: avgTemp,
        condition: this.getWeatherCondition(dailyCodes[index]),
      };
    });

    return {
      location: locationLabel,
      temperature: response.current?.temperature_2m ?? 0,
      humidity: response.current?.relative_humidity_2m ?? 0,
      precipitation: response.current?.precipitation ?? dailyRain[0] ?? 0,
      rainfall: response.current?.precipitation ?? dailyRain[0] ?? 0,
      wind_speed: response.current?.wind_speed_10m ?? 0,
      solar_radiation: response.current?.shortwave_radiation ?? 0,
      soil_temperature_0cm: response.current?.soil_temperature_0cm ?? 0,
      soil_moisture_0_1cm: response.current?.soil_moisture_0_1cm ?? 0,
      forecast,
      updated_at: response.current?.time ?? new Date().toISOString(),
    };
  }

  private getWeatherCondition(weatherCode?: number): string {
    if (weatherCode === undefined || weatherCode === null) {
      return 'Unknown';
    }

    if (weatherCode === 0) return 'Clear';
    if ([1, 2, 3].includes(weatherCode)) return 'Cloudy';
    if ([45, 48].includes(weatherCode)) return 'Fog';
    if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'Rain';
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'Snow';
    if ([95, 96, 99].includes(weatherCode)) return 'Thunderstorm';
    return 'Mixed';
  }

  // ==================== ADVISORY / ASK EXPERT ====================

  getFarmerAdvisory(status?: string): Observable<Advisory[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Advisory[]>(`${this.apiUrl}/advisory`, { params });
  }

  submitAdvisory(question: string): Observable<Advisory> {
    return this.http.post<Advisory>(`${this.apiUrl}/advisory`, { question });
  }

  getAdvisoryDetail(advisoryId: number): Observable<AdvisoryDetail> {
    return this.http.get<AdvisoryDetail>(`${this.apiUrl}/advisory/${advisoryId}`);
  }

  uploadAdvisoryImage(advisoryId: number, file: File): Observable<{ id: number; image_path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ id: number; image_path: string }>(
      `${this.apiUrl}/advisory/${advisoryId}/upload-image`,
      formData
    );
  }

  sendAdvisoryMessage(advisoryId: number, message: string): Observable<AdvisoryMessage> {
    return this.http.post<AdvisoryMessage>(`${this.apiUrl}/advisory/${advisoryId}/message`, { message });
  }

  getAdvisoryMessages(advisoryId: number): Observable<AdvisoryMessage[]> {
    return this.http.get<AdvisoryMessage[]>(`${this.apiUrl}/advisory/${advisoryId}/messages`);
  }

  // ==================== CROP INFORMATION ====================

  getCropGuides(cropName?: string, limit = 30, category?: string): Observable<CropInformation[]> {
    let params = new HttpParams();
    if (cropName) {
      params = params.set('crop_name', cropName);
    }
    params = params.set('limit', Math.max(1, Math.min(limit, 30)).toString());
    if (category?.trim()) {
      params = params.set('category', category.trim());
    }
    return this.http.get<CropInformation[]>(`${this.apiUrl}/crop-guides`, { params });
  }

  getCropGuideDetail(cropId: number): Observable<CropInformation> {
    return this.http.get<CropInformation>(`${this.apiUrl}/crop-guides/${cropId}`);
  }

  // ==================== EMPLOYMENT / JOBS ====================

  // Get farmer's own jobs
  getMyJobs(farmerId?: number, status?: string): Observable<Job[]> {
    let params = new HttpParams();
    if (farmerId) {
      params = params.set('farmer_id', farmerId.toString());
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Job[]>(`${this.apiUrl}/my-jobs`, { params });
  }

  // Create a new job
  createJob(job: Omit<Job, 'id' | 'farmer_id' | 'status' | 'created_at'>): Observable<Job> {
    return this.http.post<Job>(`${this.apiUrl}/jobs`, job);
  }

  // Get job details
  getJobDetails(jobId: number): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/jobs/${jobId}`);
  }

  // Update job
  updateJob(jobId: number, job: Partial<Job>): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/jobs/${jobId}`, job);
  }

  // Delete job
  deleteJob(jobId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/jobs/${jobId}`);
  }

  // Get applicants for a job
  getJobApplicants(jobId: number): Observable<ApplicationDetail[]> {
    return this.http.get<ApplicationDetail[]>(`${this.apiUrl}/jobs/${jobId}/applicants`);
  }

  // Get all available jobs (for browsing/applying)
  getAvailableJobs(location?: string): Observable<Job[]> {
    let params = new HttpParams();
    if (location) {
      params = params.set('location', location);
    }
    return this.http.get<Job[]>(`${this.apiUrl}/jobs`, { params });
  }

  // Get farmer's worker applications (when farmer applies as worker)
  getFarmerJobApplications(farmerId?: number): Observable<FarmerJobApplication[]> {
    let params = new HttpParams();
    if (farmerId) {
      params = params.set('farmer_id', farmerId.toString());
    }
    return this.http.get<FarmerJobApplication[]>(`${this.apiUrl}/job-applications`, { params });
  }

  getFarmerWorkerApplications(farmerId?: number): Observable<FarmerJobApplication[]> {
    return this.getFarmerJobApplications(farmerId);
  }

  // Apply for a job
  applyForJob(jobId: number, message?: string): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/jobs/${jobId}/apply`, {
      message: message?.trim() || null,
    });
  }

  // Get available workers
  getAvailableWorkers(skill?: string, location?: string): Observable<Worker[]> {
    let params = new HttpParams();
    if (skill) {
      params = params.set('skill', skill);
    }
    if (location) {
      params = params.set('location', location);
    }
    return this.http.get<Worker[]>(`${this.apiUrl}/workers`, { params });
  }

  // Create worker profile
  createWorkerProfile(worker: Omit<Worker, 'id' | 'is_blocked' | 'created_at'>): Observable<Worker> {
    return this.http.post<Worker>(`${this.apiUrl}/workers`, worker);
  }

  // ==================== EQUIPMENT RENTAL ====================

  getAvailableEquipment(location?: string): Observable<Equipment[]> {
    let params = new HttpParams();
    if (location) {
      params = params.set('location', location);
    }
    return this.http.get<Equipment[]>(`${this.apiUrl}/equipment/available`, { params });
  }

  addEquipmentForRent(equipment: Partial<Equipment>): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.apiUrl}/equipment`, equipment);
  }

  getMyEquipmentListings(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${this.apiUrl}/equipment/my-listings`);
  }

  deleteEquipment(equipmentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/equipment/${equipmentId}`);
  }

  bookEquipment(equipmentId: number, startDate: Date, endDate: Date): Observable<EquipmentBooking> {
    return this.http.post<EquipmentBooking>(`${this.apiUrl}/equipment/${equipmentId}/book`, {
      equipment_id: equipmentId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
  }

  getMyEquipmentBookings(): Observable<EquipmentBooking[]> {
    return this.http.get<EquipmentBooking[]>(`${this.apiUrl}/equipment-bookings`);
  }

  // ==================== FARMING TECHNIQUES ====================

  getFarmingTechniques(category?: string, cropType?: string): Observable<FarmingTechnique[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    if (cropType) {
      params = params.set('crop_type', cropType);
    }
    return this.http.get<FarmingTechnique[]>(`${this.apiUrl}/techniques`, { params });
  }

  getFeaturedTechniques(): Observable<FarmingTechnique[]> {
    return this.http.get<FarmingTechnique[]>(`${this.apiUrl}/techniques/featured`);
  }

  // ==================== DASHBOARD STATS ====================

  getDashboardStats(): Observable<FarmerDashboardStats> {
    return this.http.get<FarmerDashboardStats>(`${this.apiUrl}/dashboard-stats`);
  }

  // ==================== AI FEATURES ====================

  getAIAdvisor(payload: AIAdvisorRequest): Observable<AIAdvisorResponse> {
    return this.http.post<AIAdvisorResponse>(`${environment.apiUrl}/api/ai/advisor`, payload);
  }

  chatWithAI(payload: AIChatRequest): Observable<AIChatResponse> {
    return this.http.post<AIChatResponse>(`${environment.apiUrl}/api/ai/chat`, payload);
  }

  generateAIInsights(payload: AIInsightsRequest): Observable<AIInsightsResponse> {
    return this.http.post<AIInsightsResponse>(`${environment.apiUrl}/api/ai/insights`, payload);
  }

  analyzeCropImage(file: File, crop?: string, location?: string): Observable<AIImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (crop?.trim()) {
      formData.append('crop', crop.trim());
    }
    if (location?.trim()) {
      formData.append('location', location.trim());
    }
    return this.http.post<AIImageAnalysisResponse>(`${environment.apiUrl}/api/ai/analyze-image`, formData);
  }

  generateAISmartAlerts(payload: AISmartAlertsRequest): Observable<AISmartAlertsResponse> {
    return this.http.post<AISmartAlertsResponse>(`${environment.apiUrl}/api/ai/smart-alerts`, payload);
  }
}
