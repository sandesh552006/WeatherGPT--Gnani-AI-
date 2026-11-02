import { GeoLocation, WeatherData, CurrentWeather, HourlyForecastItem } from '@/lib/types';
import { WeatherAlert } from '@/lib/alertTypes';

export type SectorId =
  | 'agriculture'
  | 'aviation'
  | 'marine'
  | 'disaster'
  | 'health'
  | 'urban'
  | 'transport'
  | 'energy';

export interface SectorMeta {
  id: SectorId;
  name: string;
  iconName: string; // Lucide icon or emoji
  tag: string; // e.g., 'METAR / TAF', 'INCOIS Feed', 'NDRF Alerting'
  description: string;
  modelAttribution: string;
}

export type OperationalStatus = 'favorable' | 'caution' | 'high_risk' | 'critical';

export interface OperationalRecommendation {
  id: string;
  title: string;
  badge: string; // e.g. 'Recommended', 'Precaution', 'Optimal: 08-11 AM', 'Evening Alert'
  badgeColor: string; // Tailwind class string for badge
  description: string;
  subMetricLabel: string; // e.g. 'Best window', 'Relative Drift', 'Soil Traction', 'Rain Probability'
  subMetricValue: string; // e.g. '05:30 - 08:30', 'Medium', '92% (High)', '65%'
  whyReason: {
    factorName: string;
    currentValue: string;
    thresholdValue: string;
    operationalEffect: string;
    scientificReason: string;
  };
}

export interface OperationalHourSlot {
  hourIndex: number;
  hourLabel: string; // '06:00', '08:00', etc.
  status: 'good' | 'caution' | 'risk';
  temp: number;
  rainProb: number;
  rainMm: number;
  windKmH: number;
  reason: string;
}

export interface RiskFactorItem {
  name: string;
  points: number; // e.g. +15, +8
  reason: string;
}

export interface RiskScoreBreakdown {
  score: number; // 0 - 100
  level: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical';
  summary: string;
  factors: RiskFactorItem[];
}

export interface WeatherFactorItem {
  id: string;
  name: string;
  value: string;
  statusLabel?: string;
  statusColor?: string;
  comparisonNote?: string;
}

export interface SectorAdvisoryData {
  sector: SectorMeta;
  location: GeoLocation;
  status: OperationalStatus;
  statusLabel: string;
  statusColor: string;
  primaryDirective: string;
  recommendations: OperationalRecommendation[];
  timeline: OperationalHourSlot[];
  riskScore: RiskScoreBreakdown;
  weatherFactors: WeatherFactorItem[];
  dopplerRadarStatus: {
    title: string;
    description: string;
    isAlertActive: boolean;
  };
  recommendedActions: string[];
  avoidActions: string[];
  generatedAt: string;
  nwpSource: string;
}
