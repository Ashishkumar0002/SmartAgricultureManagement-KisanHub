import { UserRole } from './role.model';

export interface LoginPayload {
  email: string;
  username?: string;
  phone?: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface FarmerRegistrationPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  district: string;
  village: string;
  total_land_acres: number;
  soil_type: string;
  irrigation_type: string;
  water_source: string;
  crop_types: string;
  current_crops: string;
  farming_experience_years: number;
  equipment_owned?: string;
  annual_income_range?: string;
  profile_photo?: File | null;
}

export interface ExpertRegistrationPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  qualification: string;
  specialization: string;
  years_of_experience: number;
  working_organization?: string;
  service_areas: string;
  languages_known: string;
  bio?: string;
  profile_photo?: File | null;
  certifications_file?: File | null;
  id_proof_file: File;
}

export interface RegistrationResponse {
  message: string;
  user_id: number;
  role: UserRole;
  farmer_id?: number;
  expert_id?: number;
  approval_status?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role?: UserRole;
  username?: string;
}

export interface AuthUser {
  username: string;
  role: UserRole;
}

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: UserRole;
}
