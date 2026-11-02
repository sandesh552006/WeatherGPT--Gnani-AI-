import { NextRequest, NextResponse } from 'next/server';
import { FutureClimateOutlook, FutureProjectionPoint } from '@/lib/climateTypes';

export const dynamic = 'force-dynamic';

interface CacheEntry {
  data: FutureClimateOutlook;
  timestamp: number;
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
    const startYear = parseInt(searchParams.get('startYear') || '2025', 10);
    const endYear = parseInt(searchParams.get('endYear') || '2050', 10);

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const cacheKey = `proj_v2_${lat.toFixed(3)}_${lon.toFixed(3)}_${startYear}_${endYear}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const models = ['EC_Earth3P_HR', 'MRI_AGCM3_2_S', 'MPI_ESM1_2_XR'];
    const climateUrl = new URL('https://climate-api.open-meteo.com/v1/climate');
    climateUrl.searchParams.set('latitude', lat.toString());
    climateUrl.searchParams.set('longitude', lon.toString());
    climateUrl.searchParams.set('start_date', `${startYear}-01-01`);
    climateUrl.searchParams.set('end_date', `${endYear}-12-31`);
    climateUrl.searchParams.set('models', models.join(','));
    climateUrl.searchParams.set('daily', 'temperature_2m_mean,precipitation_sum');
    climateUrl.searchParams.set('timezone', 'Asia/Kolkata');

    const res = await fetchWithRetry(climateUrl.toString(), 2);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Open-Meteo Climate API error:', res.status, errText);
      return NextResponse.json(
        {
          error: 'Climate model projection data is temporarily unavailable.',
          details: errText,
          status: res.status,
        },
        { status: 502 }
      );
    }

    const json = await res.json();
    const daily = json.daily;

    if (!daily || !daily.time) {
      return NextResponse.json(
        { error: 'No daily climate model data returned' },
        { status: 200 }
      );
    }

    // Group daily values by year
    const yearlyMap = new Map<
      number,
      {
        tempsByModel: Record<string, number[]>;
        precipsByModel: Record<string, number[]>;
      }
    >();

    const times: string[] = daily.time;

    for (let i = 0; i < times.length; i++) {
      const yr = parseInt(times[i].substring(0, 4), 10);
      if (!yearlyMap.has(yr)) {
        yearlyMap.set(yr, {
          tempsByModel: {},
          precipsByModel: {},
        });
        for (const m of models) {
          yearlyMap.get(yr)!.tempsByModel[m] = [];
          yearlyMap.get(yr)!.precipsByModel[m] = [];
        }
      }

      const yearEntry = yearlyMap.get(yr)!;

      for (const m of models) {
        // Open-Meteo naming convention: temperature_2m_mean_MODEL_NAME
        const tempKey = `temperature_2m_mean_${m}`;
        const precipKey = `precipitation_sum_${m}`;

        const tVal = daily[tempKey]?.[i];
        const pVal = daily[precipKey]?.[i];

        if (typeof tVal === 'number' && !isNaN(tVal)) {
          yearEntry.tempsByModel[m].push(tVal);
        }
        if (typeof pVal === 'number' && !isNaN(pVal)) {
          yearEntry.precipsByModel[m].push(pVal);
        }
      }
    }

    // Build yearly projection points
    const projections: FutureProjectionPoint[] = [];
    const sortedYears = Array.from(yearlyMap.keys()).sort((a, b) => a - b);

    for (const yr of sortedYears) {
      const { tempsByModel, precipsByModel } = yearlyMap.get(yr)!;
      const modelTemps: Record<string, number> = {};
      const modelPrecips: Record<string, number> = {};

      let totalEnsembleTemp = 0;
      let ensembleTempCount = 0;
      let totalEnsemblePrecip = 0;
      let ensemblePrecipCount = 0;

      for (const m of models) {
        const tArr = tempsByModel[m];
        const pArr = precipsByModel[m];

        if (tArr && tArr.length >= 180) {
          const avgT = tArr.reduce((a, b) => a + b, 0) / tArr.length;
          modelTemps[m] = Number(avgT.toFixed(1));
          totalEnsembleTemp += avgT;
          ensembleTempCount++;
        }
        if (pArr && pArr.length >= 180) {
          // Normalize precipitation to annual 365-day total if days < 365
          const rawSum = pArr.reduce((a, b) => a + b, 0);
          const annualPrecip = (rawSum / pArr.length) * 365;
          modelPrecips[m] = Math.round(annualPrecip);
          totalEnsemblePrecip += annualPrecip;
          ensemblePrecipCount++;
        }
      }

      const ensembleTemp =
        ensembleTempCount > 0
          ? Number((totalEnsembleTemp / ensembleTempCount).toFixed(1))
          : 0;
      const ensemblePrecip =
        ensemblePrecipCount > 0
          ? Math.round(totalEnsemblePrecip / ensemblePrecipCount)
          : 0;

      projections.push({
        year: yr,
        ensembleTemp,
        ensemblePrecip,
        models: Object.keys(modelTemps).reduce(
          (acc, m) => ({
            ...acc,
            [m]: {
              temp: modelTemps[m],
              precip: modelPrecips[m] || 0,
            },
          }),
          {}
        ),
      });
    }

    const baselinePoint = projections[0] || { ensembleTemp: 25, ensemblePrecip: 700 };
    const endPoint =
      projections[projections.length - 1] || { ensembleTemp: 26.5, ensemblePrecip: 730 };

    const projectedTempRise2050 = Number(
      (endPoint.ensembleTemp - baselinePoint.ensembleTemp).toFixed(2)
    );
    const projectedPrecipChange2050Percent =
      baselinePoint.ensemblePrecip > 0
        ? Number(
            (
              ((endPoint.ensemblePrecip - baselinePoint.ensemblePrecip) /
                baselinePoint.ensemblePrecip) *
              100
            ).toFixed(1)
          )
        : 0;

    const payload: FutureClimateOutlook = {
      baselineReferenceYear: startYear,
      baselineTemp: baselinePoint.ensembleTemp,
      baselinePrecip: baselinePoint.ensemblePrecip,
      projections,
      availableModels: models,
      projectedTempRise2050,
      projectedPrecipChange2050Percent,
    };

    cache.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error('Server error in /api/climate/projection:', err);
    return NextResponse.json(
      { error: 'Failed to process climate projection', message: err.message },
      { status: 500 }
    );
  }
}
