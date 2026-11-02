import { NextRequest, NextResponse } from 'next/server';
import {
  HistoricalDailyRecord,
  HistoricalApiResponse,
  ClimateRiskIndicators,
  ClimateTimelineEvent,
  SeasonalAggregate,
} from '@/lib/climateTypes';
import {
  aggregateYearly,
  aggregateMonthly,
  calculateIndianSeasons,
  calculateClimateRisk,
  detectHistoricalExtremes,
} from '@/lib/climateEngine';

export const dynamic = 'force-dynamic';

// Server-side in-memory cache with 2-hour TTL
interface CacheEntry {
  data: any;
  timestamp: number;
  lat: number;
  lon: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Helper to fetch with exponential backoff on 429 or 5xx
async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      return res;
    }
    // If rate-limited (429) or transient server error (500, 502, 503, 504), wait and retry
    if ((res.status === 429 || (res.status >= 500 && res.status <= 504)) && attempt < maxRetries) {
      const delay = (attempt + 1) * 1500;
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
      continue;
    }
    return res;
  }
  return fetch(url);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat') || '28.6214';
    const lonStr = searchParams.get('lon') || '77.2148';
    const name = searchParams.get('name') || 'New Delhi';
    const country = searchParams.get('country') || 'India';
    const timezone = searchParams.get('timezone') || 'Asia/Kolkata';

    const currentYear = new Date().getFullYear();
    const startYear = Math.max(
      1980,
      Math.min(parseInt(searchParams.get('startYear') || '2000', 10), currentYear)
    );
    const endYear = Math.max(
      startYear,
      Math.min(parseInt(searchParams.get('endYear') || `${currentYear}`, 10), currentYear + 1)
    );

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}_${startYear}_${endYear}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        ...cached.data,
        cachedAt: new Date(cached.timestamp).toLocaleTimeString(),
      });
    }

    // Format dates for Open-Meteo Archive API
    // Open-Meteo ERA5 archive has data up to ~3 days ago.
    const safeRecentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const safeRecentStr = safeRecentDate.toISOString().split('T')[0];

    let endDate = `${endYear}-12-31`;
    // Strict clamp: never request beyond available archive date
    if (endDate > safeRecentStr) {
      endDate = safeRecentStr;
    }

    let startDate = `${startYear}-01-01`;
    if (startDate > endDate) {
      const sy = Math.max(1980, parseInt(endDate.substring(0, 4), 10) - 5);
      startDate = `${sy}-01-01`;
    }

    const openMeteoUrl = new URL('https://archive-api.open-meteo.com/v1/archive');
    openMeteoUrl.searchParams.set('latitude', lat.toString());
    openMeteoUrl.searchParams.set('longitude', lon.toString());
    openMeteoUrl.searchParams.set('start_date', startDate);
    openMeteoUrl.searchParams.set('end_date', endDate);
    openMeteoUrl.searchParams.set(
      'daily',
      'temperature_2m_max,temperature_2m_min,temperature_2m_mean,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean'
    );
    openMeteoUrl.searchParams.set('timezone', timezone);

    const res = await fetchWithRetry(openMeteoUrl.toString(), 2);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Open-Meteo Archive API Error:', res.status, errText);

      // Check if we have any cached data for nearby coordinates to serve as resilient fallback
      for (const entry of Array.from(cache.values())) {
        if (
          Math.abs(entry.lat - lat) < 0.1 &&
          Math.abs(entry.lon - lon) < 0.1
        ) {
          return NextResponse.json({
            ...entry.data,
            location: { name, country, latitude: lat, longitude: lon },
            isStaleFallback: true,
            warning: 'Live archive rate limit reached; displaying cached historical dataset.',
          });
        }
      }

      let userMsg = 'Historical climate data is currently unavailable from Open-Meteo archive.';
      if (res.status === 429) {
        userMsg = 'Open-Meteo API minutely request limit reached. Please wait a moment and try again.';
      }

      return NextResponse.json(
        {
          error: userMsg,
          details: errText,
          status: res.status,
        },
        { status: res.status === 429 ? 429 : 502 }
      );
    }

    const json = await res.json();
    const daily = json.daily;

    if (!daily || !daily.time || daily.time.length === 0) {
      return NextResponse.json(
        {
          location: { name, country, latitude: lat, longitude: lon },
          period: { startYear, endYear },
          dailyCount: 0,
          yearlyAggregates: [],
          monthlyAggregates: [],
          currentOverview: {
            avgTemp: 0,
            annualRainfall: 0,
            hotDays: 0,
            rainyDays: 0,
            tempAnomaly: 0,
            avgWindSpeed: 0,
          },
          dataAvailable: false,
        },
        { status: 200 }
      );
    }

    // Convert parallel arrays to daily record objects
    const records: HistoricalDailyRecord[] = [];
    const len = daily.time.length;

    for (let i = 0; i < len; i++) {
      records.push({
        date: daily.time[i],
        tempMax: daily.temperature_2m_max?.[i] ?? 0,
        tempMin: daily.temperature_2m_min?.[i] ?? 0,
        tempMean: daily.temperature_2m_mean?.[i] ?? 0,
        apparentTempMax: daily.apparent_temperature_max?.[i],
        apparentTempMin: daily.apparent_temperature_min?.[i],
        precipitation: daily.precipitation_sum?.[i] ?? 0,
        windSpeedMax: daily.wind_speed_10m_max?.[i] ?? 0,
        relativeHumidityMean: daily.relative_humidity_2m_mean?.[i],
      });
    }

    // Process aggregations
    const yearlyAggregates = aggregateYearly(records);
    const monthlyAggregates = aggregateMonthly(records);
    const seasons = calculateIndianSeasons(records);
    const riskIndicators = calculateClimateRisk(yearlyAggregates);
    const timelineEvents = detectHistoricalExtremes(records);

    // Compute overview statistics (most recent completed full year or overall mean)
    const recentYear = yearlyAggregates[yearlyAggregates.length - 1] || {
      avgTemp: 0,
      totalPrecipitation: 0,
      hotDays: 0,
      rainyDays: 0,
      avgWindSpeed: 0,
    };

    const overallAvgTemp =
      yearlyAggregates.length > 0
        ? yearlyAggregates.reduce((s, y) => s + y.avgTemp, 0) / yearlyAggregates.length
        : 0;

    const tempAnomaly =
      yearlyAggregates.length > 0
        ? Number((recentYear.avgTemp - overallAvgTemp).toFixed(1))
        : 0;

    const responsePayload = {
      location: {
        name,
        country,
        latitude: lat,
        longitude: lon,
        elevation: json.elevation,
      },
      period: { startYear, endYear },
      dailyCount: records.length,
      yearlyAggregates,
      monthlyAggregates,
      seasons,
      riskIndicators,
      timelineEvents,
      currentOverview: {
        avgTemp: Number(recentYear.avgTemp.toFixed(1)),
        annualRainfall: recentYear.totalPrecipitation,
        hotDays: recentYear.hotDays,
        rainyDays: recentYear.rainyDays,
        tempAnomaly,
        avgWindSpeed: recentYear.avgWindSpeed,
      },
      dataAvailable: true,
      source: 'Open-Meteo Historical Weather API (ECMWF ERA5 Reanalysis)',
    };

    cache.set(cacheKey, { data: responsePayload, timestamp: Date.now(), lat, lon });

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('Server error in /api/climate/historical:', err);
    return NextResponse.json(
      { error: 'Failed to process historical climate request', message: err.message },
      { status: 500 }
    );
  }
}
