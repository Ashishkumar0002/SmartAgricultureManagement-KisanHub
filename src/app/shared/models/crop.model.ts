export interface Crop {
  id: number;
  name: string;
  season: string;
  area: number;
  farmer_id?: number;
}

export interface CropPayload {
  name: string;
  season: string;
  area: number;
  farmer_id?: number;
}
