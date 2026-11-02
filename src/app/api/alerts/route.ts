import { NextRequest, NextResponse } from 'next/server';
import { WeatherAlert, AlertSeverity, AlertCategory, AlertSummaryCounts, NowcastItem, IMD_SEVERITY_CONFIG } from '@/lib/alertTypes';
import { DEFAULT_SAFETY_GUIDANCE, calculateDistanceKm } from '@/lib/alertEngine';
import { fetchWeatherData } from '@/lib/weather';

export const dynamic = 'force-dynamic';

interface CachedAlerts {
  allIndiaAlerts: WeatherAlert[];
  timestamp: number;
}

let alertsCache: CachedAlerts | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function normalizeSeverity(rawSeverity: string, rawColor?: string, message?: string): AlertSeverity {
  const s = (rawSeverity || '').trim().toLowerCase();
  const c = (rawColor || '').trim().toLowerCase();
  const m = (message || '').toLowerCase();

  if (s === 'red' || c === 'red' || s === 'warning' || m.includes('red warning')) return 'RED';
  if (s === 'orange' || c === 'orange' || s === 'alert' || m.includes('orange alert')) return 'ORANGE';
  if (s === 'yellow' || c === 'yellow' || s === 'watch' || m.includes('yellow watch')) return 'YELLOW';
  return 'GREEN';
}

function normalizeCategory(disasterType: string, message: string): AlertCategory {
  const t = (disasterType || '').toLowerCase();
  const m = (message || '').toLowerCase();

  if (t.includes('rain') || m.includes('rainfall') || m.includes('downpour')) return 'rain';
  if (t.includes('lightning') || m.includes('lightning')) return 'lightning';
  if (t.includes('thunder') || m.includes('thunderstorm') || m.includes('squall')) return 'thunderstorm';
  if (t.includes('flood') || m.includes('flood') || m.includes('inundation')) return 'flood';
  if (t.includes('cyclone') || m.includes('cyclonic') || m.includes('depression')) return 'cyclone';
  if (t.includes('heat') || m.includes('heatwave') || m.includes('hot day')) return 'heat';
  if (t.includes('cold') || m.includes('coldwave') || m.includes('frost')) return 'cold';
  if (t.includes('wind') || m.includes('gale') || m.includes('gusty')) return 'wind';
  if (t.includes('fog') || m.includes('dense fog')) return 'fog';
  return 'other';
}

async function fetchOfficialCapAlerts(): Promise<WeatherAlert[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails', {
      headers: {
        'User-Agent': 'WeatherGPT-Alerts-Engine/1.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`NDMA CAP HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawList: any[] = Array.isArray(data) ? data : [];

    const now = Date.now();
    const parsedAlerts: WeatherAlert[] = [];

    for (const item of rawList) {
      const severity = normalizeSeverity(item.severity, item.severity_color, item.warning_message);
      const category = normalizeCategory(item.disaster_type, item.warning_message);

      // Parse Centroid
      let coords: { latitude: number; longitude: number } | undefined;
      if (item.centroid && typeof item.centroid === 'string') {
        const parts = item.centroid.split(',').map((p: string) => parseFloat(p.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          // Centroid format: "longitude,latitude" or "lat,lon"
          if (parts[0] > 60 && parts[0] < 100 && parts[1] > 6 && parts[1] < 38) {
            coords = { longitude: parts[0], latitude: parts[1] };
          } else if (parts[1] > 60 && parts[1] < 100 && parts[0] > 6 && parts[0] < 38) {
            coords = { latitude: parts[0], longitude: parts[1] };
          }
        }
      }

      // Check Expiry
      let validUntil = item.effective_end_time || '';
      let isExpired = false;
      if (validUntil) {
        const endTime = new Date(validUntil).getTime();
        if (!isNaN(endTime) && endTime < now) {
          isExpired = true;
        }
      }

      if (isExpired) continue;

      const eventName = item.disaster_type ? `${item.disaster_type} Warning` : 'Severe Weather Warning';
      const sourceName = item.alert_source
        ? `India Meteorological Department / ${item.alert_source}`
        : 'India Meteorological Department (IMD)';

      parsedAlerts.push({
        id: String(item.identifier || item.alert_id_sdma_autoinc || Math.random().toString(36).substring(2)),
        severity,
        event: eventName,
        category,
        location: item.area_description || 'Regional Zone',
        district: item.area_description ? item.area_description.split(',')[0]?.trim() : undefined,
        state: item.area_description ? item.area_description.split(',').slice(-1)[0]?.trim() : undefined,
        coordinates: coords,
        description: item.warning_message || 'Active meteorological advisory issued in public safety interest.',
        issuedAt: item.effective_start_time || new Date().toISOString(),
        validFrom: item.effective_start_time || new Date().toISOString(),
        validUntil: item.effective_end_time || new Date(now + 12 * 3600 * 1000).toISOString(),
        source: sourceName,
        isOfficial: true,
        status: 'active',
        safetyGuidance: DEFAULT_SAFETY_GUIDANCE[category] || DEFAULT_SAFETY_GUIDANCE.other,
        severityColor: IMD_SEVERITY_CONFIG[severity].hex,
        severityLabel: `${IMD_SEVERITY_CONFIG[severity].label} (${IMD_SEVERITY_CONFIG[severity].actionAdvice})`,
      });
    }

    return parsedAlerts;
  } catch (err) {
    console.warn('Official NDMA CAP alert fetch failed or timed out:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '28.6214');
    const lon = parseFloat(searchParams.get('lon') || '77.2148');
    const locationName = searchParams.get('location') || 'New Delhi';
    const districtName = searchParams.get('district') || '';
    const stateName = searchParams.get('state') || '';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Check or update All-India Alerts Cache
    const now = Date.now();
    let allIndiaAlerts: WeatherAlert[] = [];

    if (!forceRefresh && alertsCache && now - alertsCache.timestamp < CACHE_TTL_MS) {
      allIndiaAlerts = alertsCache.allIndiaAlerts;
    } else {
      allIndiaAlerts = await fetchOfficialCapAlerts();
      alertsCache = {
        allIndiaAlerts,
        timestamp: now,
      };
    }

    // 2. Filter Alerts affecting selected location
    const locLower = locationName.toLowerCase();
    const distLower = districtName.toLowerCase();
    const stateLower = stateName.toLowerCase();
    const locationAlerts = allIndiaAlerts.filter((alert) => {
      // Direct locality name match
      if (alert.location && alert.location.toLowerCase().includes(locLower)) {
        return true;
      }
      if (alert.district && alert.district.toLowerCase().includes(locLower)) {
        return true;
      }
      // District match for rural areas / tehsils
      if (distLower && alert.district && (alert.district.toLowerCase().includes(distLower) || distLower.includes(alert.district.toLowerCase()))) {
        return true;
      }
      // State match if alert is statewide
      if (stateLower && alert.state && alert.state.toLowerCase() === stateLower && !alert.district) {
        return true;
      }
      // Coordinate proximity (within 90km)
      if (alert.coordinates) {
        const dist = calculateDistanceKm(lat, lon, alert.coordinates.latitude, alert.coordinates.longitude);
        if (dist <= 90) return true;
      }
      return false;
    });

    // 3. If no official alerts exist for selected location, evaluate numerical forecast thresholds (Open-Meteo)
    // and provide clearly labeled "WeatherGPT Risk Insights" if extreme weather is detected!
    if (locationAlerts.length === 0) {
      try {
        const weatherData = await fetchWeatherData({
          name: locationName,
          country: 'India',
          latitude: lat,
          longitude: lon,
        });

        const analysis = weatherData.analysis24h;
        const current = weatherData.current;

        // Heavy Rain Threshold (> 8mm in 24h or peak probability >= 75%)
        if (analysis.totalExpectedRainMm >= 8 || analysis.peakRainProbability >= 75) {
          locationAlerts.push({
            id: `risk_rain_${lat.toFixed(2)}_${lon.toFixed(2)}`,
            severity: analysis.totalExpectedRainMm >= 25 ? 'RED' : 'ORANGE',
            event: analysis.totalExpectedRainMm >= 25 ? 'Extremely Heavy Rain Risk' : 'Heavy Rainfall Alert',
            category: 'rain',
            location: locationName,
            district: locationName,
            coordinates: { latitude: lat, longitude: lon },
            description: `Numerical forecast indicates peak rain probability of ${analysis.peakRainProbability}% around ${analysis.peakRainWindow} with ~${analysis.totalExpectedRainMm} mm cumulative rainfall. Waterlogging possible in low-lying corridors.`,
            issuedAt: new Date().toISOString(),
            validFrom: new Date().toISOString(),
            validUntil: new Date(now + 12 * 3600 * 1000).toISOString(),
            source: 'WeatherGPT Risk Insight',
            isOfficial: false,
            status: 'active',
            safetyGuidance: DEFAULT_SAFETY_GUIDANCE.rain,
            severityColor: analysis.totalExpectedRainMm >= 25 ? '#ef4444' : '#f97316',
            severityLabel: analysis.totalExpectedRainMm >= 25
              ? 'Severe Weather Warning (Take Action)'
              : 'Weather Alert (Be Prepared)',
          });
        }
        // Heatwave Threshold (> 38°C)
        else if (current.temperature >= 38 || analysis.tempMax24h >= 40) {
          locationAlerts.push({
            id: `risk_heat_${lat.toFixed(2)}_${lon.toFixed(2)}`,
            severity: analysis.tempMax24h >= 42 ? 'RED' : 'ORANGE',
            event: 'Heatwave Advisory',
            category: 'heat',
            location: locationName,
            district: locationName,
            coordinates: { latitude: lat, longitude: lon },
            description: `Day temperatures are projected to peak at ${analysis.tempMax24h}°C around ${analysis.hottestHour}. High solar radiation and thermal stress likely.`,
            issuedAt: new Date().toISOString(),
            validFrom: new Date().toISOString(),
            validUntil: new Date(now + 10 * 3600 * 1000).toISOString(),
            source: 'WeatherGPT Risk Insight',
            isOfficial: false,
            status: 'active',
            safetyGuidance: DEFAULT_SAFETY_GUIDANCE.heat,
            severityColor: analysis.tempMax24h >= 42 ? '#ef4444' : '#f97316',
            severityLabel: analysis.tempMax24h >= 42
              ? 'Severe Weather Warning (Take Action)'
              : 'Weather Alert (Be Prepared)',
          });
        }
        // High Wind Threshold (> 32 km/h)
        else if (analysis.maxWindSpeedKmH >= 32) {
          locationAlerts.push({
            id: `risk_wind_${lat.toFixed(2)}_${lon.toFixed(2)}`,
            severity: 'YELLOW',
            event: 'Strong Surface Winds',
            category: 'wind',
            location: locationName,
            district: locationName,
            coordinates: { latitude: lat, longitude: lon },
            description: `Wind gusts up to ${analysis.maxWindSpeedKmH} km/h are expected. Caution advised for two-wheelers and high-profile vehicles.`,
            issuedAt: new Date().toISOString(),
            validFrom: new Date().toISOString(),
            validUntil: new Date(now + 8 * 3600 * 1000).toISOString(),
            source: 'WeatherGPT Risk Insight',
            isOfficial: false,
            status: 'active',
            safetyGuidance: DEFAULT_SAFETY_GUIDANCE.wind,
            severityColor: '#eab308',
            severityLabel: 'Weather Watch (Be Updated)',
          });
        }
      } catch (err) {
        console.warn('Weather forecast derivation skipped:', err);
      }
    }

    // 4. Compute Summary Counts across available alerts
    const totalSet = [...locationAlerts, ...allIndiaAlerts];
    const redCount = totalSet.filter((a) => a.severity === 'RED').length;
    const orangeCount = totalSet.filter((a) => a.severity === 'ORANGE').length;
    const yellowCount = totalSet.filter((a) => a.severity === 'YELLOW').length;
    const greenCount = totalSet.filter((a) => a.severity === 'GREEN').length;

    const summaryCounts: AlertSummaryCounts = {
      redCount,
      orangeCount,
      yellowCount,
      greenCount,
      totalActive: redCount + orangeCount + yellowCount,
    };

    // 5. Generate Near-Term Nowcasts
    const nowcasts: NowcastItem[] = [];
    if (locationAlerts.length > 0) {
      locationAlerts.forEach((alert, idx) => {
        nowcasts.push({
          id: `nowcast_${alert.id}_${idx}`,
          event: alert.event,
          category: alert.category,
          severity: alert.severity,
          headline: `${alert.event} affecting ${alert.location}`,
          distanceKm: alert.coordinates ? calculateDistanceKm(lat, lon, alert.coordinates.latitude, alert.coordinates.longitude) : 0,
          expectedWindow: 'Active throughout next 1–4 hours',
          sourceType: alert.isOfficial ? 'official' : 'derived',
          sourceLabel: alert.source,
        });
      });
    } else {
      // Default benign nowcast
      nowcasts.push({
        id: `nowcast_clear_${lat}_${lon}`,
        event: 'Clear / Moderate Atmospheric Conditions',
        category: 'other',
        severity: 'GREEN',
        headline: `No imminent severe meteorological events detected in ${locationName}`,
        distanceKm: 0,
        expectedWindow: 'Next 3 hours',
        sourceType: 'official',
        sourceLabel: 'India Meteorological Department (IMD)',
      });
    }

    return NextResponse.json({
      locationAlerts,
      allIndiaAlerts: allIndiaAlerts.slice(0, 30),
      summaryCounts,
      nowcasts,
      updatedAt: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      source: 'India Meteorological Department (IMD) & NDMA Sachet',
    });
  } catch (error: any) {
    console.error('Alerts API route error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch weather alerts',
        message: error?.message,
        locationAlerts: [],
        allIndiaAlerts: [],
        summaryCounts: { redCount: 0, orangeCount: 0, yellowCount: 0, greenCount: 1, totalActive: 0 },
        nowcasts: [],
      },
      { status: 500 }
    );
  }
}
