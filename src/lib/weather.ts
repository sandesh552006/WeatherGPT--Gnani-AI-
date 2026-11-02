import {
  GeoLocation,
  WeatherData,
  HourlyForecastItem,
  DailyForecastItem,
  CurrentWeather,
  MapGridPoint,
  MapRiskSummary,
} from './types';
import { getWeatherCondition } from './wmo';

// In-memory cache for weather forecasts (lat, lon)
interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}
const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes sensible caching

export async function fetchWeatherData(location: GeoLocation): Promise<WeatherData> {
  const roundedLat = location.latitude.toFixed(3);
  const roundedLon = location.longitude.toFixed(3);
  const cacheKey = `${roundedLat},${roundedLon}`;

  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', location.latitude.toString());
  url.searchParams.set('longitude', location.longitude.toString());
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m'
  );
  url.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,uv_index'
  );
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset'
  );
  url.searchParams.set('timezone', location.timezone || 'auto');
  url.searchParams.set('forecast_days', '7');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'WeatherGPT/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo forecast API error: ${res.status} ${res.statusText}`);
  }

  const raw = await res.json();
  const currentRaw = raw.current || {};
  const hourlyRaw = raw.hourly || {};
  const dailyRaw = raw.daily || {};

  // Parse Current Weather
  const currentCondition = getWeatherCondition(currentRaw.weather_code ?? 0);
  const current: CurrentWeather = {
    temperature: Math.round(currentRaw.temperature_2m ?? 0),
    feelsLike: Math.round(currentRaw.apparent_temperature ?? currentRaw.temperature_2m ?? 0),
    humidity: Math.round(currentRaw.relative_humidity_2m ?? 0),
    precipitation: currentRaw.precipitation ?? 0,
    rain: currentRaw.rain ?? 0,
    weatherCode: currentRaw.weather_code ?? 0,
    conditionText: currentCondition.description,
    conditionIcon: currentCondition.icon,
    windSpeed: Math.round(currentRaw.wind_speed_10m ?? 0),
    windDirection: Math.round(currentRaw.wind_direction_10m ?? 0),
    windGusts: Math.round(currentRaw.wind_gusts_10m ?? 0),
    pressure: Math.round(currentRaw.surface_pressure ?? 1013),
    visibility: 6, // standard visibility km
    uvIndex: currentRaw.uv_index !== undefined ? Math.round(currentRaw.uv_index) : (hourlyRaw.uv_index?.[0] ? Math.round(hourlyRaw.uv_index[0]) : 5),
    sunrise: dailyRaw.sunrise?.[0] ? new Date(dailyRaw.sunrise[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : undefined,
    sunset: dailyRaw.sunset?.[0] ? new Date(dailyRaw.sunset[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : undefined,
    timestamp: currentRaw.time || new Date().toISOString(),
  };

  // Find index for current hour in hourly array
  const times: string[] = hourlyRaw.time || [];
  let startIndex = 0;
  if (currentRaw.time) {
    const foundIndex = times.findIndex((t: string) => t >= currentRaw.time);
    if (foundIndex !== -1) {
      startIndex = foundIndex;
    }
  }

  // Next 24 hours extraction
  const next24Times = times.slice(startIndex, startIndex + 24);
  const hourly24h: HourlyForecastItem[] = next24Times.map((isoTime: string, i: number) => {
    const absIdx = startIndex + i;
    const code = hourlyRaw.weather_code?.[absIdx] ?? 0;
    const cond = getWeatherCondition(code);

    const dateObj = new Date(isoTime);
    let hourLabel = '';
    try {
      hourLabel = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
        timeZone: raw.timezone || 'UTC',
      });
    } catch {
      const h = parseInt(isoTime.split('T')[1]?.split(':')[0] || '0', 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 === 0 ? 12 : h % 12;
      hourLabel = `${formattedH} ${ampm}`;
    }

    return {
      time: isoTime,
      isoTime,
      hourLabel,
      temperature: Math.round(hourlyRaw.temperature_2m?.[absIdx] ?? 0),
      feelsLike: Math.round(hourlyRaw.apparent_temperature?.[absIdx] ?? 0),
      humidity: Math.round(hourlyRaw.relative_humidity_2m?.[absIdx] ?? 0),
      precipitationProbability: Math.round(hourlyRaw.precipitation_probability?.[absIdx] ?? 0),
      precipitation: hourlyRaw.precipitation?.[absIdx] ?? 0,
      rain: hourlyRaw.rain?.[absIdx] ?? 0,
      weatherCode: code,
      conditionText: cond.description,
      conditionIcon: cond.icon,
      windSpeed: Math.round(hourlyRaw.wind_speed_10m?.[absIdx] ?? 0),
      uvIndex: Math.round(hourlyRaw.uv_index?.[absIdx] ?? 0),
    };
  });

  // Next 24 hours analysis computation
  let peakRainProbability = 0;
  let peakIndex = -1;
  let totalExpectedRainMm = 0;
  let tempMin24h = 999;
  let tempMax24h = -999;
  let coldestHour = '';
  let hottestHour = '';
  let maxWindSpeedKmH = 0;

  hourly24h.forEach((item, idx) => {
    if (item.precipitationProbability > peakRainProbability) {
      peakRainProbability = item.precipitationProbability;
      peakIndex = idx;
    }
    totalExpectedRainMm += item.precipitation;

    if (item.temperature < tempMin24h) {
      tempMin24h = item.temperature;
      coldestHour = item.hourLabel;
    }
    if (item.temperature > tempMax24h) {
      tempMax24h = item.temperature;
      hottestHour = item.hourLabel;
    }
    if (item.windSpeed > maxWindSpeedKmH) {
      maxWindSpeedKmH = item.windSpeed;
    }
  });

  if (tempMin24h === 999) tempMin24h = current.temperature;
  if (tempMax24h === -999) tempMax24h = current.temperature;

  // Build a concise peak window around the maximum rain chance
  let peakRainWindow = 'No significant rain expected';
  if (peakRainProbability >= 30 && peakIndex !== -1) {
    const peakHour = hourly24h[peakIndex].hourLabel;
    // Look at adjacent hours to form a tight 2-3 hour window (e.g. "3–5 PM")
    const nextHour = hourly24h[peakIndex + 1]?.hourLabel;
    if (nextHour) {
      peakRainWindow = `${peakHour} – ${nextHour}`;
    } else {
      peakRainWindow = peakHour;
    }
  }

  const willRain = peakRainProbability >= 35 || totalExpectedRainMm > 0.2;

  // Parse Daily Forecast (7 days)
  const dailyTimes: string[] = dailyRaw.time || [];
  const daily: DailyForecastItem[] = dailyTimes.slice(0, 7).map((dStr: string, idx: number) => {
    const code = dailyRaw.weather_code?.[idx] ?? 0;
    const cond = getWeatherCondition(code);
    const dateObj = new Date(dStr);

    let dayLabel = '';
    let formattedDate = '';
    try {
      dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      dayLabel = `Day ${idx + 1}`;
      formattedDate = dStr;
    }

    return {
      date: dStr,
      dayLabel,
      formattedDate: `${dayLabel}, ${formattedDate}`,
      weatherCode: code,
      conditionText: cond.description,
      conditionIcon: cond.icon,
      tempMax: Math.round(dailyRaw.temperature_2m_max?.[idx] ?? 0),
      tempMin: Math.round(dailyRaw.temperature_2m_min?.[idx] ?? 0),
      precipitationProbabilityMax: Math.round(dailyRaw.precipitation_probability_max?.[idx] ?? 0),
      precipitationSum: Math.round((dailyRaw.precipitation_sum?.[idx] ?? 0) * 10) / 10,
      sunrise: dailyRaw.sunrise?.[idx]
        ? new Date(dailyRaw.sunrise[idx]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : undefined,
      sunset: dailyRaw.sunset?.[idx]
        ? new Date(dailyRaw.sunset[idx]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : undefined,
    };
  });

  const weatherData: WeatherData = {
    location,
    current,
    hourly24h,
    daily,
    analysis24h: {
      willRain,
      peakRainProbability,
      peakRainWindow,
      totalExpectedRainMm: Math.round(totalExpectedRainMm * 10) / 10,
      tempMin24h,
      tempMax24h,
      coldestHour,
      hottestHour,
      maxWindSpeedKmH,
      summary: willRain
        ? `Rain expected with peak chance of ${peakRainProbability}% around ${peakRainWindow}. Temperatures between ${tempMin24h}°C and ${tempMax24h}°C.`
        : `Mostly dry conditions expected over the next 24 hours. Temperatures range from ${tempMin24h}°C to ${tempMax24h}°C.`,
    },
  };

  weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
  return weatherData;
}

// -------------------------------------------------------------
// INDIA METEOROLOGICAL GRID (24 representative locations)
// Structured for easy extension without altering the map engine
// -------------------------------------------------------------
export interface GridLocationDefinition {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

export const INDIA_GRID_LOCATIONS: GridLocationDefinition[] = [
  // North
  { id: 'delhi', name: 'New Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { id: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', latitude: 34.0837, longitude: 74.7973 },
  { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', latitude: 31.1048, longitude: 77.1734 },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab/Haryana', latitude: 30.7333, longitude: 76.7794 },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', latitude: 26.2389, longitude: 73.0243 },
  // Central / West
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { id: 'surat', name: 'Surat', state: 'Gujarat', latitude: 21.1702, longitude: 72.8311 },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
  { id: 'raipur', name: 'Raipur', state: 'Chhattisgarh', latitude: 21.2514, longitude: 81.6296 },
  // East / Northeast
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739 },
  { id: 'patna', name: 'Patna', state: 'Bihar', latitude: 25.5941, longitude: 85.1376 },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', latitude: 20.2961, longitude: 85.8245 },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', latitude: 26.1445, longitude: 91.7362 },
  // South
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.5241, longitude: 76.9366 },
];

interface IndiaGridCache {
  points: MapGridPoint[];
  riskSummary: MapRiskSummary;
  timestamp: number;
}
let indiaGridCache: IndiaGridCache | null = null;
const GRID_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

export async function fetchIndiaGridWeather(forceRefresh = false): Promise<{
  points: MapGridPoint[];
  riskSummary: MapRiskSummary;
  updatedAt: string;
}> {
  if (!forceRefresh && indiaGridCache && Date.now() - indiaGridCache.timestamp < GRID_CACHE_TTL) {
    return {
      points: indiaGridCache.points,
      riskSummary: indiaGridCache.riskSummary,
      updatedAt: new Date(indiaGridCache.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  }

  const lats = INDIA_GRID_LOCATIONS.map((p) => p.latitude).join(',');
  const lons = INDIA_GRID_LOCATIONS.map((p) => p.longitude).join(',');

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lats);
  url.searchParams.set('longitude', lons);
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m'
  );
  url.searchParams.set(
    'hourly',
    'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,rain,weather_code,wind_speed_10m,wind_direction_10m'
  );
  url.searchParams.set('timezone', 'Asia/Kolkata');
  url.searchParams.set('forecast_days', '2');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'WeatherGPT/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo batch grid error: ${res.status} ${res.statusText}`);
  }

  const raw = await res.json();
  const resultsArray: any[] = Array.isArray(raw) ? raw : [raw];

  const heavyRainAreas: string[] = [];
  const hotAreas: string[] = [];
  const strongWindAreas: string[] = [];

  const points: MapGridPoint[] = INDIA_GRID_LOCATIONS.map((loc, idx) => {
    const data = resultsArray[idx] || {};
    const cur = data.current || {};
    const hourly = data.hourly || {};
    const times: string[] = hourly.time || [];

    const weatherCode = cur.weather_code ?? 0;
    const cond = getWeatherCondition(weatherCode);
    const temp = Math.round(cur.temperature_2m ?? 28);
    const precip = cur.precipitation ?? 0;
    const windSpd = Math.round(cur.wind_speed_10m ?? 10);
    const windDir = Math.round(cur.wind_direction_10m ?? 0);
    const humidity = Math.round(cur.relative_humidity_2m ?? 65);
    const feelsLike = Math.round(cur.apparent_temperature ?? temp);

    // Hourly slices (next 24 hours)
    const hourlyPoints = times.slice(0, 24).map((tStr: string, hIdx: number) => {
      const hCode = hourly.weather_code?.[hIdx] ?? 0;
      const hCond = getWeatherCondition(hCode);
      const d = new Date(tStr);
      let hourLabel = '';
      try {
        hourLabel = d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        });
      } catch {
        const h = parseInt(tStr.split('T')[1]?.split(':')[0] || '0', 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 === 0 ? 12 : h % 12;
        hourLabel = `${formattedH} ${ampm}`;
      }

      return {
        time: tStr,
        hourLabel,
        temperature: Math.round(hourly.temperature_2m?.[hIdx] ?? temp),
        precipitation: hourly.precipitation?.[hIdx] ?? 0,
        rainProbability: Math.round(hourly.precipitation_probability?.[hIdx] ?? 0),
        windSpeed: Math.round(hourly.wind_speed_10m?.[hIdx] ?? windSpd),
        windDirection: Math.round(hourly.wind_direction_10m?.[hIdx] ?? windDir),
        weatherCode: hCode,
        conditionIcon: hCond.icon,
      };
    });

    const rainProb = hourlyPoints[0]?.rainProbability ?? (precip > 0 ? 80 : 10);

    if (precip >= 2.5 || rainProb >= 60) {
      heavyRainAreas.push(loc.name);
    }
    if (temp >= 35) {
      hotAreas.push(loc.name);
    }
    if (windSpd >= 20) {
      strongWindAreas.push(loc.name);
    }

    return {
      id: loc.id,
      name: loc.name,
      state: loc.state,
      latitude: loc.latitude,
      longitude: loc.longitude,
      current: {
        temperature: temp,
        feelsLike,
        humidity,
        precipitation: precip,
        rainProbability: rainProb,
        weatherCode,
        conditionText: cond.description,
        conditionIcon: cond.icon,
        windSpeed: windSpd,
        windDirection: windDir,
      },
      hourly: hourlyPoints,
    };
  });

  const riskSummary: MapRiskSummary = {
    heavyRainCount: heavyRainAreas.length,
    heavyRainAreas,
    hotAreaCount: hotAreas.length,
    hotAreas,
    strongWindCount: strongWindAreas.length,
    strongWindAreas,
    totalPoints: points.length,
  };

  indiaGridCache = {
    points,
    riskSummary,
    timestamp: Date.now(),
  };

  return {
    points,
    riskSummary,
    updatedAt: new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

