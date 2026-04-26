export interface CropInfo {
  id: number;
  name: string;
  crop_type: string;
  climate_requirements: string;
  soil_type: string;
  sowing_season: string;
  harvesting_time: string;
  production_steps: string;
  best_practices: string;
  water_requirements: string;
  fertilizer_recommendations: string;
  pest_disease_prevention: string;
  expected_yield: string;
  market_tips: string;
  created_at: string;
  updated_at: string;
}

export type CropType = 'Fruit' | 'Vegetable' | 'Grain' | 'Cash Crop';
