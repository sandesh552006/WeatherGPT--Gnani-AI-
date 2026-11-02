export interface HistoricalDailyRecord {
  date: string; // YYYY-MM-DD
  tempMax: number;
  tempMin: number;
  tempMean: number;
  apparentTempMax?: number;
  apparentTempMin?: number;
  precipitation: number;
  windSpeedMax: number;
  relativeHumidityMean?: number;
}

export interface YearlyAggregate {
  year: number;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  totalPrecipitation: number;
  rainyDays: number; // precip >= 1.0mm
  hotDays: number; // tempMax >= heatThreshold (e.g., 35°C)
  avgWindSpeed: number;
  avgHumidity?: number;
  extremePrecipDays: number; // precip >= rainThreshold (e.g., 30mm)
  strongWindDays: number; // wind >= windThreshold (e.g., 25 km/h)
}

export interface MonthlyAggregate {
  year: number;
  month: number; // 1-12
  monthLabel: string; // Jan, Feb, etc.
  avgTemp: number;
  totalPrecipitation: number;
  rainyDays: number;
}

export interface SeasonalAggregate {
  seasonName: string; // Winter, Pre-Monsoon, Monsoon, Post-Monsoon
  monthsLabel: string;
  avgTemp: number;
  totalPrecipitation: number;
  avgHumidity: number;
  avgWindSpeed: number;
}

export interface ClimateAnomalyResult {
  baselineStart: number;
  baselineEnd: number;
  compareStart: number;
  compareEnd: number;
  baselineAvgTemp: number;
  compareAvgTemp: number;
  tempAnomaly: number; // compareAvgTemp - baselineAvgTemp
  baselineAvgPrecip: number;
  compareAvgPrecip: number;
  precipAnomalyPercent: number; // ((compare - baseline) / baseline) * 100
  baselineAvgHotDays: number;
  compareAvgHotDays: number;
  hotDaysDiff: number;
  baselineAvgRainyDays: number;
  compareAvgRainyDays: number;
  rainyDaysDiff: number;
  status: 'above' | 'below' | 'neutral';
  yearlyAnomalies: Array<{
    year: number;
    tempAnomaly: number;
    precipAnomaly: number;
  }>;
}

export interface ExtremeThresholds {
  heatThreshold: number; // Default 35°C
  rainThreshold: number; // Default 30mm
  windThreshold: number; // Default 25 km/h
}

export interface ClimateRiskIndicators {
  heatExposure: {
    level: 'Low' | 'Moderate' | 'High' | 'Very High';
    score: number; // 0-100
    description: string;
  };
  rainExposure: {
    level: 'Low' | 'Moderate' | 'High' | 'Very High';
    score: number;
    description: string;
  };
  dryExposure: {
    level: 'Low' | 'Moderate' | 'High' | 'Very High';
    score: number;
    description: string;
  };
  rainfallVariability: {
    level: 'Low' | 'Moderate' | 'High' | 'Very High';
    score: number;
    description: string;
  };
}

export interface FutureProjectionPoint {
  year: number;
  ensembleTemp: number;
  ensemblePrecip: number;
  models: {
    [modelName: string]: {
      temp: number;
      precip: number;
    };
  };
}

export interface FutureClimateOutlook {
  baselineReferenceYear: number;
  baselineTemp: number;
  baselinePrecip: number;
  projections: FutureProjectionPoint[];
  availableModels: string[];
  projectedTempRise2050: number;
  projectedPrecipChange2050Percent: number;
}

export interface ClimateTimelineEvent {
  id: string;
  year: number;
  date: string;
  category: 'heat' | 'rain' | 'wind' | 'cold' | 'drought';
  title: string;
  measuredValue: string;
  thresholdContext: string;
  description: string;
  source: string;
}

export interface HistoricalApiResponse {
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  period: {
    startYear: number;
    endYear: number;
  };
  dailyCount: number;
  yearlyAggregates: YearlyAggregate[];
  monthlyAggregates: MonthlyAggregate[];
  currentOverview: {
    avgTemp: number;
    annualRainfall: number;
    hotDays: number;
    rainyDays: number;
    tempAnomaly: number;
    avgWindSpeed: number;
  };
  dataAvailable: boolean;
  cachedAt?: string;
}

export interface LocationComparisonItem {
  locationName: string;
  latitude: number;
  longitude: number;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  annualRainfall: number;
  rainyDays: number;
  hotDays: number;
  avgWind: number;
  avgHumidity: number;
  seasons: Record<string, SeasonalAggregate>;
}
