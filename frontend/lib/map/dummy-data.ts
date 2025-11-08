/**
 * Dummy disaster data matching backend schema for prototype
 */

export type DisasterType = 'wildfire' | 'flood' | 'thunderstorm' | 'heatwave' | 'volcanic_ash';

export type PreventionActionType = 
  | 'goats' 
  | 'controlled_burn' 
  | 'water_bomber' 
  | 'drone_seed_bomb' 
  | 'community_alert' 
  | 'retask_satellite' 
  | 'ai_kill_switch';

export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface SatelliteData {
  fuel_dryness?: number;
  temperature_anomaly?: number;
  wind_speed?: number;
  wind_direction?: number;
  rain_forecast?: number;
  soil_moisture?: number;
  lightning_density?: number;
  population_at_risk?: number;
}

export interface DisasterThreat {
  id: string;
  type: DisasterType;
  location: Location;
  risk_percentage: number;
  time_window_hours: number;
  predicted_time?: string;
  area_at_risk_hectares?: number;
  satellite_data?: SatelliteData;
  confidence?: number;
}

export interface DisasterListResponse {
  disasters: DisasterThreat[];
  total: number;
  timestamp?: string;
}

export interface PreventionAction {
  type: PreventionActionType;
  location: Location;
  quantity?: number;
  cost: number;
  effectiveness?: number;
  description?: string;
}

// Dummy disaster data
export const DUMMY_DISASTERS: DisasterThreat[] = [
  {
    id: 'threat-001',
    type: 'wildfire',
    location: {
      latitude: 35.2401,
      longitude: 24.8093,
      name: 'Crete, Greece',
    },
    risk_percentage: 94.0,
    time_window_hours: 54,
    predicted_time: new Date(Date.now() + 54 * 60 * 60 * 1000).toISOString(),
    area_at_risk_hectares: 12400.0,
    confidence: 94.0,
    satellite_data: {
      fuel_dryness: 87.5,
      temperature_anomaly: 4.2,
      wind_speed: 68.0,
      wind_direction: 315.0,
      rain_forecast: 0.0,
      soil_moisture: 12.3,
      population_at_risk: 42000,
    },
  },
  {
    id: 'threat-002',
    type: 'wildfire',
    location: {
      latitude: -3.4653,
      longitude: -62.2159,
      name: 'Amazon Rainforest, Brazil',
    },
    risk_percentage: 89.0,
    time_window_hours: 34,
    predicted_time: new Date(Date.now() + 34 * 60 * 60 * 1000).toISOString(),
    area_at_risk_hectares: 45000.0,
    confidence: 89.0,
    satellite_data: {
      fuel_dryness: 92.1,
      temperature_anomaly: 5.8,
      wind_speed: 45.0,
      wind_direction: 180.0,
      rain_forecast: 0.0,
      soil_moisture: 8.7,
      population_at_risk: 125000,
    },
  },
  {
    id: 'threat-003',
    type: 'flood',
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
      name: 'Delhi, India',
    },
    risk_percentage: 76.0,
    time_window_hours: 48,
    predicted_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    area_at_risk_hectares: 8500.0,
    confidence: 76.0,
    satellite_data: {
      soil_moisture: 95.2,
      rain_forecast: 250.0,
      temperature_anomaly: 2.1,
      population_at_risk: 280000,
    },
  },
  {
    id: 'threat-004',
    type: 'wildfire',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      name: 'Los Angeles, USA',
    },
    risk_percentage: 82.0,
    time_window_hours: 72,
    predicted_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    area_at_risk_hectares: 18500.0,
    confidence: 82.0,
    satellite_data: {
      fuel_dryness: 78.3,
      temperature_anomaly: 6.1,
      wind_speed: 55.0,
      wind_direction: 270.0,
      rain_forecast: 0.0,
      soil_moisture: 15.2,
      population_at_risk: 95000,
    },
  },
  {
    id: 'threat-005',
    type: 'thunderstorm',
    location: {
      latitude: 25.2048,
      longitude: 55.2708,
      name: 'Dubai, UAE',
    },
    risk_percentage: 68.0,
    time_window_hours: 24,
    predicted_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    area_at_risk_hectares: 3200.0,
    confidence: 68.0,
    satellite_data: {
      lightning_density: 12.5,
      wind_speed: 85.0,
      wind_direction: 135.0,
      rain_forecast: 180.0,
      temperature_anomaly: 1.8,
      population_at_risk: 150000,
    },
  },
  {
    id: 'threat-006',
    type: 'flood',
    location: {
      latitude: 22.3193,
      longitude: 114.1694,
      name: 'Hong Kong',
    },
    risk_percentage: 71.0,
    time_window_hours: 36,
    predicted_time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    area_at_risk_hectares: 5200.0,
    confidence: 71.0,
    satellite_data: {
      soil_moisture: 88.5,
      rain_forecast: 320.0,
      temperature_anomaly: 1.5,
      wind_speed: 42.0,
      wind_direction: 90.0,
      population_at_risk: 320000,
    },
  },
];

// Prevention action types with metadata
export const PREVENTION_ACTIONS: Record<PreventionActionType, { name: string; icon: string; defaultCost: number; defaultEffectiveness: number }> = {
  goats: {
    name: 'Goat Grazing',
    icon: '🐐',
    defaultCost: 5000,
    defaultEffectiveness: 15,
  },
  controlled_burn: {
    name: 'Controlled Burn',
    icon: '🔥',
    defaultCost: 25000,
    defaultEffectiveness: 30,
  },
  water_bomber: {
    name: 'Water Bomber',
    icon: '✈️',
    defaultCost: 50000,
    defaultEffectiveness: 40,
  },
  drone_seed_bomb: {
    name: 'Drone Seed Bomb',
    icon: '🚁',
    defaultCost: 15000,
    defaultEffectiveness: 25,
  },
  community_alert: {
    name: 'Community Alert',
    icon: '📢',
    defaultCost: 2000,
    defaultEffectiveness: 10,
  },
  retask_satellite: {
    name: 'Retask Satellite',
    icon: '🛰️',
    defaultCost: 100000,
    defaultEffectiveness: 20,
  },
  ai_kill_switch: {
    name: 'AI Kill Switch',
    icon: '⚡',
    defaultCost: 75000,
    defaultEffectiveness: 35,
  },
};

