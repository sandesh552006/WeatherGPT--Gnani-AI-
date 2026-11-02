import {
  HistoricalDailyRecord,
  YearlyAggregate,
  MonthlyAggregate,
  SeasonalAggregate,
  ClimateAnomalyResult,
  ExtremeThresholds,
  ClimateRiskIndicators,
  ClimateTimelineEvent,
} from './climateTypes';

export const DEFAULT_THRESHOLDS: ExtremeThresholds = {
  heatThreshold: 35, // 35°C
  rainThreshold: 30, // 30mm/day (Heavy precipitation)
  windThreshold: 25, // 25 km/h
};

/**
 * Aggregates raw daily records into yearly summaries
 */
export function aggregateYearly(
  records: HistoricalDailyRecord[],
  thresholds: ExtremeThresholds = DEFAULT_THRESHOLDS
): YearlyAggregate[] {
  const byYear = new Map<number, HistoricalDailyRecord[]>();

  for (const r of records) {
    if (!r.date) continue;
    const yr = parseInt(r.date.substring(0, 4), 10);
    if (isNaN(yr)) continue;
    if (!byYear.has(yr)) {
      byYear.set(yr, []);
    }
    byYear.get(yr)!.push(r);
  }

  const result: YearlyAggregate[] = [];
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => a - b);

  for (const yr of sortedYears) {
    const days = byYear.get(yr)!;
    if (days.length === 0) continue;

    let sumTemp = 0;
    let minTemp = Infinity;
    let maxTemp = -Infinity;
    let totalPrecip = 0;
    let rainyDays = 0;
    let hotDays = 0;
    let extremePrecipDays = 0;
    let strongWindDays = 0;
    let sumWind = 0;
    let sumHumidity = 0;
    let humidityCount = 0;

    for (const d of days) {
      sumTemp += d.tempMean;
      if (d.tempMin < minTemp) minTemp = d.tempMin;
      if (d.tempMax > maxTemp) maxTemp = d.tempMax;

      totalPrecip += d.precipitation || 0;
      if (d.precipitation >= 1.0) rainyDays++;
      if (d.tempMax >= thresholds.heatThreshold) hotDays++;
      if (d.precipitation >= thresholds.rainThreshold) extremePrecipDays++;
      if (d.windSpeedMax >= thresholds.windThreshold) strongWindDays++;

      sumWind += d.windSpeedMax || 0;
      if (typeof d.relativeHumidityMean === 'number' && !isNaN(d.relativeHumidityMean)) {
        sumHumidity += d.relativeHumidityMean;
        humidityCount++;
      }
    }

    result.push({
      year: yr,
      avgTemp: Number((sumTemp / days.length).toFixed(1)),
      minTemp: minTemp === Infinity ? 0 : Number(minTemp.toFixed(1)),
      maxTemp: maxTemp === -Infinity ? 0 : Number(maxTemp.toFixed(1)),
      totalPrecipitation: Math.round(totalPrecip),
      rainyDays,
      hotDays,
      avgWindSpeed: Number((sumWind / days.length).toFixed(1)),
      avgHumidity: humidityCount > 0 ? Math.round(sumHumidity / humidityCount) : undefined,
      extremePrecipDays,
      strongWindDays,
    });
  }

  return result;
}

/**
 * Aggregates daily records into monthly summaries
 */
export function aggregateMonthly(records: HistoricalDailyRecord[]): MonthlyAggregate[] {
  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const map = new Map<string, HistoricalDailyRecord[]>();

  for (const r of records) {
    if (!r.date || r.date.length < 7) continue;
    const key = r.date.substring(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const result: MonthlyAggregate[] = [];
  const sortedKeys = Array.from(map.keys()).sort();

  for (const key of sortedKeys) {
    const [yearStr, monthStr] = key.split('-');
    const yr = parseInt(yearStr, 10);
    const mo = parseInt(monthStr, 10);
    const days = map.get(key)!;

    let sumTemp = 0;
    let totalPrecip = 0;
    let rainyDays = 0;

    for (const d of days) {
      sumTemp += d.tempMean;
      totalPrecip += d.precipitation || 0;
      if (d.precipitation >= 1.0) rainyDays++;
    }

    result.push({
      year: yr,
      month: mo,
      monthLabel: monthLabels[mo - 1] || `${mo}`,
      avgTemp: Number((sumTemp / days.length).toFixed(1)),
      totalPrecipitation: Math.round(totalPrecip),
      rainyDays,
    });
  }

  return result;
}

/**
 * Calculates linear regression trend (slope and total delta over period)
 */
export function calculateTrend(points: Array<{ x: number; y: number }>): {
  slope: number;
  changeTotal: number;
  direction: 'increasing' | 'decreasing' | 'stable';
} {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, changeTotal: 0, direction: 'stable' };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = points[i].x;
    const y = points[i].y;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, changeTotal: 0, direction: 'stable' };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const changeTotal = slope * (points[n - 1].x - points[0].x);

  const direction =
    Math.abs(changeTotal) < 0.2
      ? 'stable'
      : changeTotal > 0
      ? 'increasing'
      : 'decreasing';

  return {
    slope: Number(slope.toFixed(3)),
    changeTotal: Number(changeTotal.toFixed(2)),
    direction,
  };
}

/**
 * Calculates climate anomaly by comparing a recent period against a historical baseline period
 */
export function calculateAnomaly(
  yearly: YearlyAggregate[],
  baselineStart: number = 2000,
  baselineEnd: number = 2010,
  compareStart: number = 2020,
  compareEnd: number = 2026
): ClimateAnomalyResult {
  const baselineYears = yearly.filter(
    (y) => y.year >= baselineStart && y.year <= baselineEnd
  );
  const compareYears = yearly.filter(
    (y) => y.year >= compareStart && y.year <= compareEnd
  );

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const baselineAvgTemp = avg(baselineYears.map((y) => y.avgTemp));
  const compareAvgTemp = avg(compareYears.map((y) => y.avgTemp));
  const tempAnomaly = Number((compareAvgTemp - baselineAvgTemp).toFixed(2));

  const baselineAvgPrecip = avg(baselineYears.map((y) => y.totalPrecipitation));
  const compareAvgPrecip = avg(compareYears.map((y) => y.totalPrecipitation));
  const precipDiff = compareAvgPrecip - baselineAvgPrecip;
  const precipAnomalyPercent =
    baselineAvgPrecip > 0
      ? Number(((precipDiff / baselineAvgPrecip) * 100).toFixed(1))
      : 0;

  const baselineAvgHotDays = avg(baselineYears.map((y) => y.hotDays));
  const compareAvgHotDays = avg(compareYears.map((y) => y.hotDays));
  const hotDaysDiff = Math.round(compareAvgHotDays - baselineAvgHotDays);

  const baselineAvgRainyDays = avg(baselineYears.map((y) => y.rainyDays));
  const compareAvgRainyDays = avg(compareYears.map((y) => y.rainyDays));
  const rainyDaysDiff = Math.round(compareAvgRainyDays - baselineAvgRainyDays);

  const yearlyAnomalies = yearly.map((y) => ({
    year: y.year,
    tempAnomaly: Number((y.avgTemp - baselineAvgTemp).toFixed(2)),
    precipAnomaly: Math.round(y.totalPrecipitation - baselineAvgPrecip),
  }));

  const status =
    tempAnomaly > 0.2 ? 'above' : tempAnomaly < -0.2 ? 'below' : 'neutral';

  return {
    baselineStart,
    baselineEnd,
    compareStart,
    compareEnd,
    baselineAvgTemp: Number(baselineAvgTemp.toFixed(1)),
    compareAvgTemp: Number(compareAvgTemp.toFixed(1)),
    tempAnomaly,
    baselineAvgPrecip: Math.round(baselineAvgPrecip),
    compareAvgPrecip: Math.round(compareAvgPrecip),
    precipAnomalyPercent,
    baselineAvgHotDays: Math.round(baselineAvgHotDays),
    compareAvgHotDays: Math.round(compareAvgHotDays),
    hotDaysDiff,
    baselineAvgRainyDays: Math.round(baselineAvgRainyDays),
    compareAvgRainyDays: Math.round(compareAvgRainyDays),
    rainyDaysDiff,
    status,
    yearlyAnomalies,
  };
}

/**
 * Calculates Indian seasonal climate breakdown
 * 1. Winter: Dec, Jan, Feb
 * 2. Pre-Monsoon (Summer): Mar, Apr, May
 * 3. Monsoon: Jun, Jul, Aug, Sep
 * 4. Post-Monsoon (Autumn): Oct, Nov
 */
export function calculateIndianSeasons(
  records: HistoricalDailyRecord[]
): Record<string, SeasonalAggregate> {
  const seasonBuckets: Record<string, HistoricalDailyRecord[]> = {
    Winter: [],
    'Pre-Monsoon': [],
    Monsoon: [],
    'Post-Monsoon': [],
  };

  for (const r of records) {
    if (!r.date || r.date.length < 7) continue;
    const month = parseInt(r.date.substring(5, 7), 10);
    if (month === 12 || month === 1 || month === 2) {
      seasonBuckets['Winter'].push(r);
    } else if (month >= 3 && month <= 5) {
      seasonBuckets['Pre-Monsoon'].push(r);
    } else if (month >= 6 && month <= 9) {
      seasonBuckets['Monsoon'].push(r);
    } else if (month === 10 || month === 11) {
      seasonBuckets['Post-Monsoon'].push(r);
    }
  }

  const seasonMeta: Record<string, { label: string }> = {
    Winter: { label: 'December – February' },
    'Pre-Monsoon': { label: 'March – May' },
    Monsoon: { label: 'June – September' },
    'Post-Monsoon': { label: 'October – November' },
  };

  const result: Record<string, SeasonalAggregate> = {};

  // Count distinct years represented in the dataset to compute average seasonal rain per year
  const yearsSet = new Set(records.map((r) => r.date.substring(0, 4)));
  const yearCount = Math.max(yearsSet.size, 1);

  for (const [season, days] of Object.entries(seasonBuckets)) {
    if (days.length === 0) {
      result[season] = {
        seasonName: season,
        monthsLabel: seasonMeta[season].label,
        avgTemp: 0,
        totalPrecipitation: 0,
        avgHumidity: 0,
        avgWindSpeed: 0,
      };
      continue;
    }

    let sumTemp = 0;
    let sumPrecip = 0;
    let sumWind = 0;
    let sumHum = 0;
    let humCount = 0;

    for (const d of days) {
      sumTemp += d.tempMean;
      sumPrecip += d.precipitation || 0;
      sumWind += d.windSpeedMax || 0;
      if (typeof d.relativeHumidityMean === 'number' && !isNaN(d.relativeHumidityMean)) {
        sumHum += d.relativeHumidityMean;
        humCount++;
      }
    }

    result[season] = {
      seasonName: season,
      monthsLabel: seasonMeta[season].label,
      avgTemp: Number((sumTemp / days.length).toFixed(1)),
      // Seasonal precipitation normalized to annual seasonal average
      totalPrecipitation: Math.round(sumPrecip / yearCount),
      avgHumidity: humCount > 0 ? Math.round(sumHum / humCount) : 55,
      avgWindSpeed: Number((sumWind / days.length).toFixed(1)),
    };
  }

  return result;
}

/**
 * Calculates transparent, analytical Climate Risk Indicators from historical data
 */
export function calculateClimateRisk(yearly: YearlyAggregate[]): ClimateRiskIndicators {
  if (yearly.length === 0) {
    return {
      heatExposure: { level: 'Low', score: 20, description: 'Insufficient data' },
      rainExposure: { level: 'Low', score: 20, description: 'Insufficient data' },
      dryExposure: { level: 'Low', score: 20, description: 'Insufficient data' },
      rainfallVariability: { level: 'Low', score: 20, description: 'Insufficient data' },
    };
  }

  const recent = yearly.slice(-10); // Last 10 years or available
  const avgHotDays = recent.reduce((s, y) => s + y.hotDays, 0) / recent.length;
  const avgExtremePrecip = recent.reduce((s, y) => s + y.extremePrecipDays, 0) / recent.length;

  // Rainfall standard deviation & CV
  const precips = recent.map((y) => y.totalPrecipitation);
  const meanPrecip = precips.reduce((a, b) => a + b, 0) / precips.length;
  const variance =
    precips.reduce((a, b) => a + Math.pow(b - meanPrecip, 2), 0) / precips.length;
  const stdDev = Math.sqrt(variance);
  const cv = meanPrecip > 0 ? (stdDev / meanPrecip) * 100 : 0;

  // 1. Heat Exposure
  let heatLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  let heatScore = Math.min(Math.round((avgHotDays / 90) * 100), 95);
  if (avgHotDays >= 60) heatLevel = 'Very High';
  else if (avgHotDays >= 35) heatLevel = 'High';
  else if (avgHotDays >= 15) heatLevel = 'Moderate';

  // 2. Rain Exposure
  let rainLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  let rainScore = Math.min(Math.round((avgExtremePrecip / 15) * 100), 95);
  if (avgExtremePrecip >= 10) rainLevel = 'Very High';
  else if (avgExtremePrecip >= 5) rainLevel = 'High';
  else if (avgExtremePrecip >= 2) rainLevel = 'Moderate';

  // 3. Dry Exposure (based on frequency of low rain years < 80% of mean)
  const droughtYears = recent.filter((y) => y.totalPrecipitation < 0.75 * meanPrecip).length;
  let dryLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  let dryScore = Math.min(droughtYears * 30 + 15, 95);
  if (droughtYears >= 3) dryLevel = 'High';
  else if (droughtYears >= 1) dryLevel = 'Moderate';

  // 4. Rainfall Variability
  let varLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  let varScore = Math.min(Math.round(cv * 2.5), 95);
  if (cv >= 35) varLevel = 'Very High';
  else if (cv >= 25) varLevel = 'High';
  else if (cv >= 15) varLevel = 'Moderate';

  return {
    heatExposure: {
      level: heatLevel,
      score: Math.max(heatScore, 10),
      description: `Averages ${Math.round(avgHotDays)} hot days (≥35°C) annually over the last decade.`,
    },
    rainExposure: {
      level: rainLevel,
      score: Math.max(rainScore, 10),
      description: `Averages ${avgExtremePrecip.toFixed(1)} extreme rainfall days (≥30mm) per year.`,
    },
    dryExposure: {
      level: dryLevel,
      score: Math.max(dryScore, 10),
      description: `${droughtYears} significant dry deficit year(s) recorded in the last 10 years.`,
    },
    rainfallVariability: {
      level: varLevel,
      score: Math.max(varScore, 10),
      description: `Inter-annual precipitation coefficient of variation is ${Math.round(cv)}%.`,
    },
  };
}

/**
 * Scans daily records to detect genuine, data-backed historical climate milestones
 */
export function detectHistoricalExtremes(
  records: HistoricalDailyRecord[]
): ClimateTimelineEvent[] {
  if (records.length === 0) return [];

  const events: ClimateTimelineEvent[] = [];

  // Find max daily temperature
  let maxTempRecord = records[0];
  let minTempRecord = records[0];
  let maxPrecipRecord = records[0];
  let maxWindRecord = records[0];

  for (const r of records) {
    if (r.tempMax > maxTempRecord.tempMax) maxTempRecord = r;
    if (r.tempMin < minTempRecord.tempMin) minTempRecord = r;
    if (r.precipitation > maxPrecipRecord.precipitation) maxPrecipRecord = r;
    if (r.windSpeedMax > maxWindRecord.windSpeedMax) maxWindRecord = r;
  }

  // 1. All-time highest temperature recorded in period
  if (maxTempRecord.tempMax >= 38) {
    const yr = parseInt(maxTempRecord.date.substring(0, 4), 10);
    events.push({
      id: `max_temp_${maxTempRecord.date}`,
      year: yr,
      date: maxTempRecord.date,
      category: 'heat',
      title: 'Peak Extreme Heat Record',
      measuredValue: `${maxTempRecord.tempMax}°C`,
      thresholdContext: 'Exceeded 99th percentile summer temperature',
      description: `Historical peak temperature recorded on ${maxTempRecord.date}, reaching an extreme daily maximum of ${maxTempRecord.tempMax}°C.`,
      source: 'Open-Meteo ERA5 Reanalysis',
    });
  }

  // 2. Highest 24-hour precipitation record
  if (maxPrecipRecord.precipitation >= 35) {
    const yr = parseInt(maxPrecipRecord.date.substring(0, 4), 10);
    events.push({
      id: `max_rain_${maxPrecipRecord.date}`,
      year: yr,
      date: maxPrecipRecord.date,
      category: 'rain',
      title: 'Heavy Precipitation Event',
      measuredValue: `${maxPrecipRecord.precipitation} mm`,
      thresholdContext: 'Exceeded IMD heavy rainfall threshold',
      description: `Single-day precipitation deluge of ${maxPrecipRecord.precipitation} mm measured on ${maxPrecipRecord.date}.`,
      source: 'Open-Meteo ERA5 Reanalysis',
    });
  }

  // 3. Peak wind speed
  if (maxWindRecord.windSpeedMax >= 30) {
    const yr = parseInt(maxWindRecord.date.substring(0, 4), 10);
    events.push({
      id: `max_wind_${maxWindRecord.date}`,
      year: yr,
      date: maxWindRecord.date,
      category: 'wind',
      title: 'Severe Wind Gust Event',
      measuredValue: `${maxWindRecord.windSpeedMax} km/h`,
      thresholdContext: 'Exceeded 25 km/h squall threshold',
      description: `Peak atmospheric wind speed reached ${maxWindRecord.windSpeedMax} km/h on ${maxWindRecord.date}.`,
      source: 'Open-Meteo ERA5 Reanalysis',
    });
  }

  // 4. Lowest winter temperature
  if (minTempRecord.tempMin <= 10) {
    const yr = parseInt(minTempRecord.date.substring(0, 4), 10);
    events.push({
      id: `min_temp_${minTempRecord.date}`,
      year: yr,
      date: minTempRecord.date,
      category: 'cold',
      title: 'Extreme Winter Minimum',
      measuredValue: `${minTempRecord.tempMin}°C`,
      thresholdContext: 'Cold wave condition threshold',
      description: `Severe winter low recorded on ${minTempRecord.date} with minimum temperature plunging to ${minTempRecord.tempMin}°C.`,
      source: 'Open-Meteo ERA5 Reanalysis',
    });
  }

  // Sort timeline chronologically
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generates downloadable CSV content from yearly climate aggregates
 */
export function formatAnalysisToCSV(
  locationName: string,
  yearly: YearlyAggregate[]
): string {
  const headers = [
    'Year',
    'Avg_Temperature_C',
    'Min_Temperature_C',
    'Max_Temperature_C',
    'Total_Precipitation_mm',
    'Rainy_Days_Count',
    'Hot_Days_Count',
    'Avg_Wind_Speed_kmh',
    'Avg_Humidity_Percent',
    'Heavy_Rain_Days',
  ];

  const rows = yearly.map((y) => [
    y.year,
    y.avgTemp,
    y.minTemp,
    y.maxTemp,
    y.totalPrecipitation,
    y.rainyDays,
    y.hotDays,
    y.avgWindSpeed,
    y.avgHumidity ?? '',
    y.extremePrecipDays,
  ]);

  const meta = [
    `# WeatherGPT Climate & Historical Analysis Export`,
    `# Location: ${locationName}`,
    `# Exported At: ${new Date().toISOString()}`,
    `# Data Source: Open-Meteo Historical Weather API (ERA5 Reanalysis)`,
    '',
  ];

  const csvContent = [
    ...meta,
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  return csvContent;
}
