export interface GeoLocation {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code?: string;
  admin1?: string; // State
  admin2?: string; // District
  admin3?: string; // Taluka / Tehsil / Sub-district
  state?: string;
  district?: string;
  subdistrict?: string;
  village?: string;
  locality?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  precipitationProbability?: number;
  rain: number;
  weatherCode: number;
  conditionText: string;
  conditionIcon: string;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  visibility: number; // in km
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
  timestamp: string;
}

export interface HourlyForecastItem {
  time: string;
  isoTime: string;
  hourLabel: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitationProbability: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  conditionText: string;
  conditionIcon: string;
  windSpeed: number;
  uvIndex: number;
}

export interface DailyForecastItem {
  date: string;
  dayLabel: string;
  formattedDate: string;
  weatherCode: number;
  conditionText: string;
  conditionIcon: string;
  tempMax: number;
  tempMin: number;
  precipitationProbabilityMax: number;
  precipitationSum?: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherData {
  location: GeoLocation;
  current: CurrentWeather;
  hourly24h: HourlyForecastItem[];
  daily: DailyForecastItem[];
  analysis24h: {
    willRain: boolean;
    peakRainProbability: number;
    peakRainWindow: string;
    totalExpectedRainMm: number;
    tempMin24h: number;
    tempMax24h: number;
    coldestHour: string;
    hottestHour: string;
    maxWindSpeedKmH: number;
    summary: string;
  };
}

export interface WeatherSummaryCardData {
  locationName: string;
  country?: string;
  temperature: number;
  feelsLike: number;
  conditionText: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  pressure?: number;
  visibility?: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  summaryCard?: WeatherSummaryCardData;
  followUps?: string[];
  timestamp: string;
  isError?: boolean;
  isConfigError?: boolean;
}

export interface ChatApiRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  locationContext?: {
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    admin2?: string;
    state?: string;
    district?: string;
  };
  language?: string;
}

export interface ChatApiResponse {
  reply: string;
  summaryCard?: WeatherSummaryCardData;
  followUps?: string[];
  location?: GeoLocation;
  isConfigError?: boolean;
  error?: string;
}

export type WeatherMapLayer = 'satellite' | 'rainfall' | 'temp' | 'wind';

export interface MapGridPoint {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    rainProbability: number;
    weatherCode: number;
    conditionText: string;
    conditionIcon: string;
    windSpeed: number;
    windDirection: number;
  };
  hourly: Array<{
    time: string;
    hourLabel: string;
    temperature: number;
    precipitation: number;
    rainProbability: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    conditionIcon: string;
  }>;
}

export interface MapRiskSummary {
  heavyRainCount: number;
  heavyRainAreas: string[];
  hotAreaCount: number;
  hotAreas: string[];
  strongWindCount: number;
  strongWindAreas: string[];
  totalPoints: number;
}

