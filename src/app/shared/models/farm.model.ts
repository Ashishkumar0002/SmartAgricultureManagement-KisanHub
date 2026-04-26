export interface Farmer {
  id: number;
  name: string;
  location: string;
  total_land: number;
  phone?: string;
}

export interface FarmerPayload {
  name: string;
  location: string;
  total_land: number;
  phone?: string;
}
