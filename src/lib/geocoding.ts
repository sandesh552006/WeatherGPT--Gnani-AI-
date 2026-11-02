import { GeoLocation } from './types';
import { getEnglishQueryForGeocoding, findIndianLocation } from './i18n/locations';

// Simple in-memory cache for geocoding lookups
const geocodeCache = new Map<string, { data: (GeoLocation & { population?: number; feature_code?: string })[]; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function searchLocations(
  query: string,
  count: number = 6
): Promise<(GeoLocation & { population?: number; feature_code?: string })[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `${cleanQuery.toLowerCase()}_${count}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const englishQuery = getEnglishQueryForGeocoding(cleanQuery);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      englishQuery
    )}&count=${Math.max(count, 10)}&language=en&format=json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherGPT/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Geocoding failed with status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      const local = findIndianLocation(cleanQuery) || findIndianLocation(englishQuery);
      if (local) {
        return [{
          name: local.name.en,
          latitude: local.latitude,
          longitude: local.longitude,
          country: local.country.en,
          country_code: 'IN',
          admin1: local.state.en,
          admin2: '',
          timezone: local.timezone,
          population: 1000000,
          feature_code: 'PPLA',
        }];
      }
      return [];
    }

    const results = data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || '',
      country_code: item.country_code || '',
      admin1: item.admin1 || '',
      admin2: item.admin2 || '',
      admin3: item.admin3 || '',
      state: item.admin1 || '',
      district: item.admin2 || '',
      subdistrict: item.admin3 || '',
      timezone: item.timezone || 'Asia/Kolkata',
      population: item.population || 0,
      feature_code: item.feature_code || '',
    }));

    // Prioritize Indian locations unless the query explicitly specifies a foreign country
    const queryLower = cleanQuery.toLowerCase();
    const hasForeignExplicit =
      queryLower.includes('usa') ||
      queryLower.includes('uk') ||
      queryLower.includes('spain') ||
      queryLower.includes('canada') ||
      queryLower.includes('australia');

    if (!hasForeignExplicit) {
      results.sort((a: any, b: any) => {
        const aIsIN = a.country_code?.toUpperCase() === 'IN' ? 1 : 0;
        const bIsIN = b.country_code?.toUpperCase() === 'IN' ? 1 : 0;
        if (aIsIN !== bIsIN) return bIsIN - aIsIN;
        // Exact name match boost
        const aExact = a.name.toLowerCase() === queryLower ? 1 : 0;
        const bExact = b.name.toLowerCase() === queryLower ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        return (b.population || 0) - (a.population || 0);
      });
    }

    const sliced = results.slice(0, count);
    geocodeCache.set(cacheKey, { data: sliced, timestamp: Date.now() });
    return sliced;
  } catch (error) {
    console.error('Error searching locations in Open-Meteo:', error);
    const local = findIndianLocation(cleanQuery);
    if (local) {
      return [{
        name: local.name.en,
        latitude: local.latitude,
        longitude: local.longitude,
        country: local.country.en,
        country_code: 'IN',
        admin1: local.state.en,
        admin2: '',
        timezone: local.timezone,
        population: 1000000,
        feature_code: 'PPLA',
      }];
    }
    return [];
  }
}

// Simple in-memory cache for reverse geocoding
const reverseGeocodeCache = new Map<string, { data: GeoLocation; timestamp: number }>();

/**
 * Reverse geocodes coordinates into a verified locality and administrative hierarchy.
 * Never fabricates names; falls back gracefully to broader administrative division or coordinates.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
  const roundedLat = Math.round(latitude * 10000) / 10000;
  const roundedLon = Math.round(longitude * 10000) / 10000;
  const cacheKey = `${roundedLat}_${roundedLon}`;

  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    // Preserve the caller's exact GPS coordinates even when serving cached locality metadata
    return {
      ...cached.data,
      latitude,
      longitude,
    };
  }

  // 1. Primary: OpenStreetMap Nominatim (Contains granular Indian villages, hamlets, tehsils & talukas)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherGPT-App/1.0 (Mozilla/5.0; Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // 1a. Locality granularity: village > hamlet > isolated_dwelling > suburb > neighbourhood > residential > town > city
      let village = addr.village || addr.hamlet || addr.isolated_dwelling || '';
      // Normalize common phonetic variations in Maharashtra gazetteers (e.g. Aalephata -> Alephata)
      if (village.toLowerCase() === 'aalephata') {
        village = 'Alephata';
      }

      const locality =
        village ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.town ||
        addr.city ||
        addr.municipality ||
        '';

      // 1b. Taluka / Tehsil / Sub-district (In India, Nominatim places taluka/tehsil in 'county' or 'subdistrict')
      let taluka = addr.subdistrict || addr.county || addr.tehsil || '';
      taluka = taluka.replace(/\s+(Subdistrict|Taluka|Tehsil)$/i, '').trim();

      // 1c. District (In India, Nominatim places revenue district in 'state_district')
      let district = addr.state_district || addr.district || '';
      district = district.replace(/\s+district$/i, '').trim();

      // 1d. State & Country
      const state = addr.state || '';
      const country = addr.country || 'India';
      const country_code = (addr.country_code || 'in').toUpperCase();

      // Most specific locality available
      const localityName =
        village ||
        locality ||
        taluka ||
        district ||
        `Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;

      const result: GeoLocation = {
        name: localityName,
        latitude,
        longitude,
        country,
        country_code,
        admin1: state,
        admin2: district,
        admin3: taluka,
        state,
        district,
        subdistrict: taluka,
        village: village || undefined,
        locality: locality || localityName,
        timezone: 'Asia/Kolkata',
      };

      reverseGeocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode attempt failed, trying fallback:', err);
  }

  // 2. Secondary fallback: BigDataCloud Reverse Geocode Client API
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const admins = data.localityInfo?.administrative || [];

      let district = '';
      let taluka = '';
      let village = '';
      const state = data.principalSubdivision || '';
      const country = data.countryName || 'India';
      const country_code = data.countryCode || 'IN';

      for (const a of admins) {
        const desc = (a.description || '').toLowerCase();
        const name = a.name || '';
        if ((desc.includes('district') || a.adminLevel === 5) && !district) {
          district = name.replace(/\s+district$/i, '').trim();
        } else if ((desc.includes('taluka') || desc.includes('tehsil') || a.adminLevel === 6) && !taluka) {
          taluka = name.replace(/\s+(taluka|tehsil)$/i, '').trim();
        } else if ((desc.includes('village') || desc.includes('hamlet') || a.adminLevel === 8) && !village) {
          village = name.trim();
        }
      }

      if (village.toLowerCase() === 'aalephata') {
        village = 'Alephata';
      }

      const localityName =
        village ||
        data.locality ||
        data.city ||
        taluka ||
        district ||
        `Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;

      const result: GeoLocation = {
        name: localityName,
        latitude,
        longitude,
        country,
        country_code,
        admin1: state,
        admin2: district,
        admin3: taluka,
        state,
        district,
        subdistrict: taluka,
        village: village || undefined,
        locality: localityName,
        timezone: 'Asia/Kolkata',
      };

      reverseGeocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode fallback failed:', err);
  }

  // 3. Final safe fallback (preserves user exact GPS coordinates without fake names)
  const fallbackResult: GeoLocation = {
    name: `Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
    latitude,
    longitude,
    country: 'India',
    country_code: 'IN',
    timezone: 'Asia/Kolkata',
  };

  return fallbackResult;
}

export async function resolveLocation(query: string): Promise<{
  matched: GeoLocation | null;
  ambiguous: boolean;
  alternatives?: GeoLocation[];
}> {
  const results = await searchLocations(query, 6);

  if (results.length === 0) {
    const local = findIndianLocation(query);
    if (local) {
      return {
        matched: {
          name: local.name.en,
          latitude: local.latitude,
          longitude: local.longitude,
          country: local.country.en,
          country_code: 'IN',
          admin1: local.state.en,
          timezone: local.timezone,
        },
        ambiguous: false,
      };
    }
    return { matched: null, ambiguous: false };
  }

  // If only 1 result, unambiguous
  if (results.length === 1) {
    return { matched: results[0], ambiguous: false };
  }

  const first = results[0];
  const second = results[1];

  // If user already specified comma or admin (e.g. "Springfield, IL" or "New Delhi, India"), unambiguous
  const hasCommaOrSpecifier = query.includes(',') || query.split(/\s+/).length > 2;
  if (hasCommaOrSpecifier) {
    return { matched: first, ambiguous: false };
  }

  // Check if there are multiple prominent matches with the exact same name
  // e.g. "Springfield" (Missouri, Illinois, Massachusetts, Ohio all have 50k+ to 170k+ population)
  const exactNameMatches = results.filter(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase()
  );

  if (exactNameMatches.length > 1) {
    const pop1 = exactNameMatches[0].population || 0;
    const pop2 = exactNameMatches[1].population || 0;

    // If the top match is a national capital (PPLC) and has a huge population difference
    const isMajorCapital = exactNameMatches[0].feature_code === 'PPLC';
    const isDominant = pop1 > 100000 && (pop2 === 0 || pop1 / Math.max(pop2, 1) > 5);

    if (isMajorCapital || isDominant) {
      return { matched: exactNameMatches[0], ambiguous: false };
    }

    // Truly ambiguous like Springfield (multiple cities with comparable population)
    return {
      matched: first,
      ambiguous: true,
      alternatives: exactNameMatches.slice(0, 4),
    };
  }

  return { matched: results[0], ambiguous: false };
}
