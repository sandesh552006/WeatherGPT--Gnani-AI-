export type AlertSeverity = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';

export type AlertCategory =
  | 'rain'
  | 'thunderstorm'
  | 'lightning'
  | 'cyclone'
  | 'heat'
  | 'cold'
  | 'wind'
  | 'fog'
  | 'flood'
  | 'other';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  event: string;
  category: AlertCategory;
  location: string;
  district?: string;
  state?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description: string;
  issuedAt: string;
  validFrom: string;
  validUntil: string;
  source: string; // e.g., "India Meteorological Department (IMD)" or "NDMA / Sachet" or "WeatherGPT Risk Insight"
  isOfficial: boolean;
  status: 'active' | 'expired' | 'updated';
  safetyGuidance: string[];
  severityColor: string; // hex code
  severityLabel: string; // e.g. "Severe Weather Warning (Take Action)"
}

export interface AlertSummaryCounts {
  redCount: number;
  orangeCount: number;
  yellowCount: number;
  greenCount: number;
  totalActive: number;
}

export interface NowcastItem {
  id: string;
  event: string;
  category: AlertCategory;
  severity: AlertSeverity;
  headline: string;
  distanceKm?: number;
  expectedWindow: string; // e.g. "Next 1–3 hours"
  sourceType: 'official' | 'derived';
  sourceLabel: string;
}

export interface AlertPreferences {
  severities: {
    RED: boolean;
    ORANGE: boolean;
    YELLOW: boolean;
  };
  categories: {
    rain: boolean;
    thunderstorm: boolean;
    lightning: boolean;
    heat: boolean;
    cold: boolean;
    wind: boolean;
    cyclone: boolean;
    flood: boolean;
    fog: boolean;
  };
}

export const IMD_SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    label: string;
    actionAdvice: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    cardBg: string;
    hex: string;
    icon: string;
  }
> = {
  RED: {
    label: 'Severe Weather Warning',
    actionAdvice: 'Take Action',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    border: 'border-rose-500',
    cardBg: 'bg-rose-50/80',
    hex: '#ef4444',
    icon: '🔴',
  },
  ORANGE: {
    label: 'Weather Alert',
    actionAdvice: 'Be Prepared',
    badgeBg: 'bg-orange-500',
    badgeText: 'text-white',
    border: 'border-orange-500',
    cardBg: 'bg-orange-50/80',
    hex: '#f97316',
    icon: '🟠',
  },
  YELLOW: {
    label: 'Weather Watch',
    actionAdvice: 'Be Updated',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-amber-950',
    border: 'border-amber-400',
    cardBg: 'bg-amber-50/80',
    hex: '#eab308',
    icon: '🟡',
  },
  GREEN: {
    label: 'No Active Warning',
    actionAdvice: 'Normal Weather',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-white',
    border: 'border-emerald-400',
    cardBg: 'bg-emerald-50/80',
    hex: '#22c55e',
    icon: '🟢',
  },
};
