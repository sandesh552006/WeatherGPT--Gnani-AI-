import { WeatherAlert, AlertSeverity, AlertCategory, AlertPreferences, IMD_SEVERITY_CONFIG } from './alertTypes';

const SEEN_ALERTS_KEY = 'weathergpt_seen_alerts_v1';
const DISMISSED_ALERTS_KEY = 'weathergpt_dismissed_alerts_v1';
const ALERT_PREFS_KEY = 'weathergpt_alert_preferences_v1';

export const DEFAULT_SAFETY_GUIDANCE: Record<AlertCategory, string[]> = {
  rain: [
    'Avoid traveling through water-logged roads and underpasses.',
    'Do not walk or drive across flooded streams or moving water.',
    'Keep power banks charged and store clean drinking water.',
    'Monitor local administrative advisories and IMD updates.',
  ],
  thunderstorm: [
    'Immediately take shelter inside a sturdy building.',
    'Avoid open fields, hilltops, and metal structures.',
    'Do not take shelter under isolated or tall trees.',
    'Unplug sensitive electronic devices and avoid using corded phones.',
  ],
  lightning: [
    'Seek immediate shelter in an enclosed building or hard-topped vehicle.',
    'Avoid plumbing, sinks, and metal conductors during the storm.',
    'If caught in an open field, crouch low with feet together; do not lie flat.',
    'Stay indoors for at least 30 minutes after the last thunderclap.',
  ],
  heat: [
    'Drink water and oral rehydration solutions frequently, even if not thirsty.',
    'Avoid direct sun exposure between 12:00 PM and 3:30 PM.',
    'Wear light-colored, loose, breathable cotton garments.',
    'Ensure children and pets are never left unattended in parked vehicles.',
  ],
  cold: [
    'Wear layered warm clothing to insulate body heat effectively.',
    'Cover ears, hands, and feet to prevent frostbite and hypothermia.',
    'Ensure proper ventilation when using room heaters or fireplaces.',
    'Keep warm fluids and nourishing food accessible.',
  ],
  wind: [
    'Secure loose outdoor items, tin sheets, awnings, and flowerpots.',
    'Stay well clear of tree branches, signboards, and overhead cables.',
    'Exercise extreme caution while operating two-wheelers and high-sided vehicles.',
    'Park vehicles inside garages or away from old trees.',
  ],
  cyclone: [
    'Heed official evacuation notices issued by SDMA and district authorities promptly.',
    'Prepare an emergency grab-bag with water, dry rations, first-aid, and vital documents.',
    'Fasten doors and windows firmly; stay away from glass panes.',
    'Do not venture outdoors during the calm "eye" of the storm as severe winds will resume.',
  ],
  flood: [
    'Evacuate to elevated shelters if instructed by disaster authorities.',
    'Do not attempt to walk, swim, or drive through flowing floodwaters.',
    'Turn off main electricity and gas switches before evacuating.',
    'Boil or purify water before drinking to avoid water-borne infections.',
  ],
  fog: [
    'Drive with low-beam headlights and hazard lights only when stopped safely.',
    'Maintain a safe following distance of at least 4–5 vehicle lengths.',
    'Use lane markings as visual guides and avoid abrupt overtaking.',
    'Keep windshield defrosters operating continuously.',
  ],
  other: [
    'Follow official advisories issued by the India Meteorological Department.',
    'Keep emergency contact numbers handy.',
    'Check on vulnerable neighbors and elderly family members.',
  ],
};

export function generateAlertKey(alert: WeatherAlert): string {
  return `${alert.id}_${alert.severity}_${alert.validUntil}`;
}

export function getSeenAlerts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEEN_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markAlertSeen(alertKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSeenAlerts();
    if (!current.includes(alertKey)) {
      current.push(alertKey);
      localStorage.setItem(SEEN_ALERTS_KEY, JSON.stringify(current.slice(-50)));
    }
  } catch (e) {
    console.error('Failed to mark alert as seen:', e);
  }
}

export function isAlertDismissed(alertKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(DISMISSED_ALERTS_KEY);
    const dismissed: string[] = raw ? JSON.parse(raw) : [];
    return dismissed.includes(alertKey);
  } catch {
    return false;
  }
}

export function dismissAlert(alertKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DISMISSED_ALERTS_KEY);
    const dismissed: string[] = raw ? JSON.parse(raw) : [];
    if (!dismissed.includes(alertKey)) {
      dismissed.push(alertKey);
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed.slice(-50)));
    }
  } catch (e) {
    console.error('Failed to dismiss alert:', e);
  }
}

export function getDefaultAlertPreferences(): AlertPreferences {
  return {
    severities: {
      RED: true,
      ORANGE: true,
      YELLOW: true,
    },
    categories: {
      rain: true,
      thunderstorm: true,
      lightning: true,
      heat: true,
      cold: true,
      wind: true,
      cyclone: true,
      flood: true,
      fog: true,
    },
  };
}

export function getAlertPreferences(): AlertPreferences {
  if (typeof window === 'undefined') return getDefaultAlertPreferences();
  try {
    const raw = localStorage.getItem(ALERT_PREFS_KEY);
    return raw ? JSON.parse(raw) : getDefaultAlertPreferences();
  } catch {
    return getDefaultAlertPreferences();
  }
}

export function saveAlertPreferences(prefs: AlertPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALERT_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save alert preferences:', e);
  }
}

export function sortAlertsBySeverity(alerts: WeatherAlert[]): WeatherAlert[] {
  const priorityOrder: Record<AlertSeverity, number> = {
    RED: 4,
    ORANGE: 3,
    YELLOW: 2,
    GREEN: 1,
  };

  return [...alerts].sort((a, b) => {
    const pA = priorityOrder[a.severity] || 0;
    const pB = priorityOrder[b.severity] || 0;
    if (pA !== pB) return pB - pA;
    // Secondary: newer alerts first
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
  });
}

// Great-circle distance between two points in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
