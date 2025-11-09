/**
 * Dummy disaster data matching backend schema for prototype
 */

export type DisasterType = 
  | 'wildfire' 
  | 'flood' 
  | 'thunderstorm' 
  | 'heatwave' 
  | 'volcanic_ash'
  | 'earthquake'
  | 'tropical_cyclone'
  | 'volcano'
  | 'drought'
  | 'extreme_temperature'
  | 'severe_storm'
  | 'sea_ice'
  | 'landslide'
  | 'tsunami'
  | 'miscellaneous';

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

export interface DisasterListResponse {
  disasters: DisasterThreat[];
  total: number;
  timestamp?: string;
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

export interface PreventionAction {
  type: PreventionActionType;
  location: Location;
  quantity?: number;
  cost: number;
  effectiveness?: number;
  description?: string;
}

export interface PreventionPlan {
  threat_id: string;
  initial_risk: number;
  final_risk: number;
  risk_reduction: number;
  total_cost: number;
  actions: PreventionAction[];
  calculation_time: number;
  success: boolean;
}

// Dummy disaster data with all disaster types for testing
export const DUMMY_DISASTERS: DisasterThreat[] = [
  // Wildfires
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
  // Floods
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
  // Earthquakes
  {
    id: 'threat-007',
    type: 'earthquake',
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      name: 'Tokyo, Japan',
    },
    risk_percentage: 85.0,
    time_window_hours: 12,
    predicted_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    confidence: 78.0,
    satellite_data: {
      temperature_anomaly: 1.2,
      population_at_risk: 1500000,
    },
  },
  {
    id: 'threat-008',
    type: 'earthquake',
    location: {
      latitude: -15.7617,
      longitude: -72.4877,
      name: 'Southern Peru',
    },
    risk_percentage: 72.0,
    time_window_hours: 24,
    predicted_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    confidence: 65.0,
    satellite_data: {
      temperature_anomaly: 0.8,
      population_at_risk: 85000,
    },
  },
  // Tropical Cyclones
  {
    id: 'threat-009',
    type: 'tropical_cyclone',
    location: {
      latitude: 25.0330,
      longitude: 121.5654,
      name: 'Taipei, Taiwan',
    },
    risk_percentage: 88.0,
    time_window_hours: 48,
    predicted_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    confidence: 82.0,
    satellite_data: {
      wind_speed: 120.0,
      wind_direction: 270.0,
      rain_forecast: 450.0,
      temperature_anomaly: 2.5,
      population_at_risk: 2500000,
    },
  },
  {
    id: 'threat-010',
    type: 'tropical_cyclone',
    location: {
      latitude: 19.4326,
      longitude: -99.1332,
      name: 'Mexico City, Mexico',
    },
    risk_percentage: 75.0,
    time_window_hours: 72,
    predicted_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    confidence: 70.0,
    satellite_data: {
      wind_speed: 95.0,
      wind_direction: 180.0,
      rain_forecast: 380.0,
      population_at_risk: 9000000,
    },
  },
  // Volcanoes
  {
    id: 'threat-011',
    type: 'volcano',
    location: {
      latitude: -8.3405,
      longitude: 115.0920,
      name: 'Mount Agung, Bali',
    },
    risk_percentage: 82.0,
    time_window_hours: 18,
    predicted_time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    confidence: 75.0,
    satellite_data: {
      temperature_anomaly: 8.5,
      wind_speed: 25.0,
      wind_direction: 90.0,
      population_at_risk: 450000,
    },
  },
  {
    id: 'threat-012',
    type: 'volcano',
    location: {
      latitude: 19.4753,
      longitude: -155.6063,
      name: 'Kilauea, Hawaii',
    },
    risk_percentage: 68.0,
    time_window_hours: 36,
    predicted_time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    confidence: 72.0,
    satellite_data: {
      temperature_anomaly: 6.2,
      population_at_risk: 185000,
    },
  },
  // Tsunamis
  {
    id: 'threat-013',
    type: 'tsunami',
    location: {
      latitude: -6.2088,
      longitude: 106.8456,
      name: 'Jakarta, Indonesia',
    },
    risk_percentage: 79.0,
    time_window_hours: 6,
    predicted_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    confidence: 68.0,
    satellite_data: {
      population_at_risk: 10500000,
    },
  },
  {
    id: 'threat-014',
    type: 'tsunami',
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      name: 'Pacific Coast, Japan',
    },
    risk_percentage: 71.0,
    time_window_hours: 12,
    predicted_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    confidence: 65.0,
    satellite_data: {
      population_at_risk: 3200000,
    },
  },
  // Droughts
  {
    id: 'threat-015',
    type: 'drought',
    location: {
      latitude: -26.2041,
      longitude: 28.0473,
      name: 'Johannesburg, South Africa',
    },
    risk_percentage: 84.0,
    time_window_hours: 720,
    predicted_time: new Date(Date.now() + 720 * 60 * 60 * 1000).toISOString(),
    confidence: 88.0,
    satellite_data: {
      soil_moisture: 5.2,
      temperature_anomaly: 4.8,
      rain_forecast: 0.0,
      population_at_risk: 4500000,
    },
  },
  {
    id: 'threat-016',
    type: 'drought',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      name: 'California, USA',
    },
    risk_percentage: 77.0,
    time_window_hours: 480,
    predicted_time: new Date(Date.now() + 480 * 60 * 60 * 1000).toISOString(),
    confidence: 80.0,
    satellite_data: {
      soil_moisture: 8.5,
      temperature_anomaly: 5.2,
      rain_forecast: 0.0,
      population_at_risk: 39000000,
    },
  },
  // Extreme Temperature
  {
    id: 'threat-017',
    type: 'extreme_temperature',
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
      name: 'New Delhi, India',
    },
    risk_percentage: 91.0,
    time_window_hours: 24,
    predicted_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    confidence: 85.0,
    satellite_data: {
      temperature_anomaly: 8.5,
      population_at_risk: 32000000,
    },
  },
  {
    id: 'threat-018',
    type: 'extreme_temperature',
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      name: 'London, UK',
    },
    risk_percentage: 65.0,
    time_window_hours: 48,
    predicted_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    confidence: 70.0,
    satellite_data: {
      temperature_anomaly: -12.5,
      population_at_risk: 9000000,
    },
  },
  // Severe Storms
  {
    id: 'threat-019',
    type: 'severe_storm',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      name: 'New York, USA',
    },
    risk_percentage: 73.0,
    time_window_hours: 18,
    predicted_time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    confidence: 78.0,
    satellite_data: {
      wind_speed: 95.0,
      wind_direction: 225.0,
      rain_forecast: 180.0,
      lightning_density: 15.2,
      population_at_risk: 20000000,
    },
  },
  {
    id: 'threat-020',
    type: 'severe_storm',
    location: {
      latitude: 25.2048,
      longitude: 55.2708,
      name: 'Dubai, UAE',
    },
    risk_percentage: 68.0,
    time_window_hours: 24,
    predicted_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    confidence: 65.0,
    satellite_data: {
      lightning_density: 12.5,
      wind_speed: 85.0,
      wind_direction: 135.0,
      rain_forecast: 180.0,
      temperature_anomaly: 1.8,
      population_at_risk: 150000,
    },
  },
  // Landslides
  {
    id: 'threat-021',
    type: 'landslide',
    location: {
      latitude: 27.7172,
      longitude: 85.3240,
      name: 'Kathmandu, Nepal',
    },
    risk_percentage: 81.0,
    time_window_hours: 36,
    predicted_time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    confidence: 74.0,
    satellite_data: {
      soil_moisture: 92.5,
      rain_forecast: 280.0,
      population_at_risk: 1500000,
    },
  },
  {
    id: 'threat-022',
    type: 'landslide',
    location: {
      latitude: -6.2088,
      longitude: 106.8456,
      name: 'Java, Indonesia',
    },
    risk_percentage: 76.0,
    time_window_hours: 48,
    predicted_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    confidence: 71.0,
    satellite_data: {
      soil_moisture: 88.0,
      rain_forecast: 320.0,
      population_at_risk: 850000,
    },
  },
  // Sea Ice
  {
    id: 'threat-023',
    type: 'sea_ice',
    location: {
      latitude: 78.2232,
      longitude: 15.6267,
      name: 'Svalbard, Norway',
    },
    risk_percentage: 69.0,
    time_window_hours: 168,
    predicted_time: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
    confidence: 72.0,
    satellite_data: {
      temperature_anomaly: -15.2,
      population_at_risk: 2500,
    },
  },
  {
    id: 'threat-024',
    type: 'sea_ice',
    location: {
      latitude: 64.8378,
      longitude: -147.7164,
      name: 'Alaska, USA',
    },
    risk_percentage: 64.0,
    time_window_hours: 240,
    predicted_time: new Date(Date.now() + 240 * 60 * 60 * 1000).toISOString(),
    confidence: 68.0,
    satellite_data: {
      temperature_anomaly: -12.8,
      population_at_risk: 730000,
    },
  },
  // Miscellaneous
  {
    id: 'threat-025',
    type: 'miscellaneous',
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      name: 'Paris, France',
    },
    risk_percentage: 55.0,
    time_window_hours: 72,
    predicted_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    confidence: 60.0,
    satellite_data: {
      population_at_risk: 2100000,
    },
  },
  // Thunderstorm (existing)
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
  // Wildfire (existing)
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
  // Thai Events
  {
    id: 'threat-026',
    type: 'flood',
    location: {
      latitude: 13.7563,
      longitude: 100.5018,
      name: 'Bangkok, Thailand',
    },
    risk_percentage: 87.0,
    time_window_hours: 36,
    predicted_time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    area_at_risk_hectares: 12000.0,
    confidence: 85.0,
    satellite_data: {
      soil_moisture: 92.5,
      rain_forecast: 380.0,
      temperature_anomaly: 2.8,
      wind_speed: 45.0,
      wind_direction: 180.0,
      population_at_risk: 8500000,
    },
  },
  {
    id: 'threat-027',
    type: 'tropical_cyclone',
    location: {
      latitude: 12.5657,
      longitude: 99.9396,
      name: 'Prachuap Khiri Khan, Thailand',
    },
    risk_percentage: 79.0,
    time_window_hours: 48,
    predicted_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    confidence: 76.0,
    satellite_data: {
      wind_speed: 110.0,
      wind_direction: 225.0,
      rain_forecast: 420.0,
      temperature_anomaly: 2.2,
      population_at_risk: 520000,
    },
  },
  {
    id: 'threat-028',
    type: 'landslide',
    location: {
      latitude: 18.7883,
      longitude: 98.9853,
      name: 'Chiang Mai, Thailand',
    },
    risk_percentage: 73.0,
    time_window_hours: 24,
    predicted_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    confidence: 70.0,
    satellite_data: {
      soil_moisture: 89.5,
      rain_forecast: 290.0,
      population_at_risk: 1300000,
    },
  },
  {
    id: 'threat-029',
    type: 'drought',
    location: {
      latitude: 15.8700,
      longitude: 100.9925,
      name: 'Nakhon Sawan, Thailand',
    },
    risk_percentage: 81.0,
    time_window_hours: 600,
    predicted_time: new Date(Date.now() + 600 * 60 * 60 * 1000).toISOString(),
    confidence: 83.0,
    satellite_data: {
      soil_moisture: 6.8,
      temperature_anomaly: 5.5,
      rain_forecast: 0.0,
      population_at_risk: 1050000,
    },
  },
  {
    id: 'threat-030',
    type: 'extreme_temperature',
    location: {
      latitude: 13.7563,
      longitude: 100.5018,
      name: 'Bangkok, Thailand',
    },
    risk_percentage: 88.0,
    time_window_hours: 48,
    predicted_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    confidence: 86.0,
    satellite_data: {
      temperature_anomaly: 9.2,
      population_at_risk: 10500000,
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

