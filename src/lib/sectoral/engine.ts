import { WeatherData, HourlyForecastItem } from '@/lib/types';
import { WeatherAlert } from '@/lib/alertTypes';
import {
  SectorId,
  SectorAdvisoryData,
  OperationalStatus,
  OperationalRecommendation,
  OperationalHourSlot,
  RiskScoreBreakdown,
  RiskFactorItem,
  WeatherFactorItem,
} from './types';
import { getSectorMeta } from './rules';

export function generateSectorAdvisory(
  sectorId: SectorId,
  weather: WeatherData | null,
  alerts: WeatherAlert[] = []
): SectorAdvisoryData {
  const sector = getSectorMeta(sectorId);

  // Fallback defaults if weather is null
  const current = weather?.current || {
    temperature: 28,
    feelsLike: 30,
    humidity: 70,
    precipitation: 0,
    precipitationProbability: 20,
    rain: 0,
    weatherCode: 1,
    conditionText: 'Partly Cloudy',
    conditionIcon: '🌤️',
    windSpeed: 10,
    windDirection: 180,
    windGusts: 14,
    pressure: 1010,
    visibility: 8,
    uvIndex: 6,
    timestamp: new Date().toISOString(),
  };

  const hourly = weather?.hourly24h || [];
  const analysis = weather?.analysis24h;
  const location = weather?.location || {
    name: 'New Delhi',
    country: 'India',
    latitude: 28.6214,
    longitude: 77.2148,
  };

  // 1. Build Weather Factors (Image 2 right panel)
  const weatherFactors: WeatherFactorItem[] = [
    {
      id: 'temp',
      name: 'Temperature',
      value: `${Math.round(current.temperature)}°C`,
      statusLabel:
        current.temperature > 38
          ? 'Extreme'
          : current.temperature > 34
          ? 'Elevated'
          : current.temperature < 15
          ? 'Cool'
          : 'Normal',
      statusColor:
        current.temperature > 38
          ? 'text-rose-600 bg-rose-50'
          : current.temperature > 34
          ? 'text-amber-600 bg-amber-50'
          : 'text-emerald-600 bg-emerald-50',
      comparisonNote: `Feels like ${Math.round(current.feelsLike)}°C`,
    },
    {
      id: 'humidity',
      name: 'Relative Humidity',
      value: `${Math.round(current.humidity)}%`,
      statusLabel:
        current.humidity > 80
          ? 'Elevated'
          : current.humidity < 30
          ? 'Dry'
          : 'Moderate',
      statusColor:
        current.humidity > 80
          ? 'text-amber-600 bg-amber-50'
          : 'text-blue-600 bg-blue-50',
      comparisonNote: current.humidity > 80 ? 'High moisture load' : 'Normal range',
    },
    {
      id: 'rain_prob',
      name: 'Rain Probability',
      value: `${Math.round(current.precipitationProbability ?? analysis?.peakRainProbability ?? 20)}%`,
      statusLabel:
        (current.precipitationProbability ?? 0) > 50
          ? 'Convective'
          : (current.precipitationProbability ?? 0) > 25
          ? 'Scattered'
          : 'Low',
      statusColor:
        (current.precipitationProbability ?? 0) > 50
          ? 'text-blue-700 bg-blue-50'
          : 'text-slate-600 bg-slate-50',
      comparisonNote: analysis?.peakRainWindow
        ? `Peak window: ${analysis.peakRainWindow}`
        : 'Negligible precipitation',
    },
    {
      id: 'wind',
      name: 'Sustained Wind',
      value: `${Math.round(current.windSpeed)} km/h`,
      statusLabel:
        current.windSpeed > 25
          ? 'Gusty'
          : current.windSpeed > 15
          ? 'Breezy'
          : 'Light',
      statusColor:
        current.windSpeed > 25
          ? 'text-rose-600 bg-rose-50'
          : current.windSpeed > 15
          ? 'text-amber-600 bg-amber-50'
          : 'text-teal-600 bg-teal-50',
      comparisonNote: `Gust: ${Math.round(current.windGusts || current.windSpeed * 1.3)} km/h`,
    },
    {
      id: 'uv',
      name: 'Solar UV Index',
      value: `${(current.uvIndex ?? 6).toFixed(1)}`,
      statusLabel:
        (current.uvIndex ?? 6) >= 8
          ? 'Very High'
          : (current.uvIndex ?? 6) >= 6
          ? 'High'
          : 'Moderate',
      statusColor:
        (current.uvIndex ?? 6) >= 8
          ? 'text-rose-600 bg-rose-50'
          : (current.uvIndex ?? 6) >= 6
          ? 'text-amber-600 bg-amber-50'
          : 'text-emerald-600 bg-emerald-50',
      comparisonNote:
        (current.uvIndex ?? 6) >= 6 ? 'Midday protection advised' : 'Safe exposure',
    },
    {
      id: 'visibility',
      name: 'Ground Visibility',
      value: `${Math.round(current.visibility || 6)} km`,
      statusLabel:
        (current.visibility || 6) < 3
          ? 'Fog'
          : (current.visibility || 6) < 6
          ? 'Haze'
          : 'Clear',
      statusColor:
        (current.visibility || 6) < 3
          ? 'text-rose-600 bg-rose-50'
          : (current.visibility || 6) < 6
          ? 'text-amber-600 bg-amber-50'
          : 'text-slate-600 bg-slate-50',
      comparisonNote:
        (current.visibility || 6) < 6
          ? 'Particulate / atmospheric haze'
          : 'Optimal horizontal visibility',
    },
    {
      id: 'precip_24h',
      name: '24h Expected Rain',
      value: `${(analysis?.totalExpectedRainMm ?? current.precipitation ?? 0).toFixed(1)} mm`,
      statusLabel:
        (analysis?.totalExpectedRainMm ?? 0) > 20
          ? 'Heavy'
          : (analysis?.totalExpectedRainMm ?? 0) > 5
          ? 'Moderate'
          : 'Minimal',
      statusColor:
        (analysis?.totalExpectedRainMm ?? 0) > 20
          ? 'text-rose-600 bg-rose-50'
          : (analysis?.totalExpectedRainMm ?? 0) > 5
          ? 'text-blue-600 bg-blue-50'
          : 'text-emerald-600 bg-emerald-50',
      comparisonNote: 'Accumulated precipitation load',
    },
  ];

  // 2. Build Doppler / IMD Alert Subcard
  const activeAlert = alerts && alerts.length > 0 ? alerts[0] : null;
  const dopplerRadarStatus = activeAlert
    ? {
        title: `Official Alert: ${activeAlert.event}`,
        description: `${activeAlert.severity} warning active: ${activeAlert.description.slice(0, 110)}... Source: ${activeAlert.source}`,
        isAlertActive: true,
      }
    : {
        title: 'Radar & Atmospheric Scan (NWP Synthesis)',
        description: `Echo scans show atmospheric parameters in ${location.name} within manageable operational boundaries. No severe squall lines active.`,
        isAlertActive: false,
      };

  // 3. Build 24-Hour Operational Timeline
  const timeline: OperationalHourSlot[] = [];
  const hoursToProcess = hourly.slice(0, 24);

  for (let i = 0; i < hoursToProcess.length; i++) {
    const h = hoursToProcess[i];
    const rainP = h.precipitationProbability || 0;
    const rainM = h.precipitation || 0;
    const wind = h.windSpeed || 0;
    const t = h.temperature;

    let slotStatus: 'good' | 'caution' | 'risk' = 'good';
    let reason = 'Optimal operational window';

    if (rainM >= 5 || rainP >= 70 || wind >= 30 || t >= 42) {
      slotStatus = 'risk';
      reason =
        rainM >= 5 || rainP >= 70
          ? 'Heavy precipitation risk'
          : wind >= 30
          ? 'Severe wind gusts'
          : 'Extreme thermal stress';
    } else if (rainM >= 1 || rainP >= 40 || wind >= 18 || t >= 36) {
      slotStatus = 'caution';
      reason =
        rainM >= 1 || rainP >= 40
          ? 'Light showers possible'
          : wind >= 18
          ? 'Breezy conditions'
          : 'Elevated daytime heat';
    }

    timeline.push({
      hourIndex: i,
      hourLabel: h.hourLabel || `${i}:00`,
      status: slotStatus,
      temp: Math.round(t),
      rainProb: Math.round(rainP),
      rainMm: Number(rainM.toFixed(1)),
      windKmH: Math.round(wind),
      reason,
    });
  }

  // Calculate best operational window from timeline
  const goodSlots = timeline.filter((s) => s.status === 'good');
  let bestWindowStr = '06:00 - 11:00';
  if (goodSlots.length >= 3) {
    const startH = goodSlots[0].hourLabel;
    const endH = goodSlots[Math.min(3, goodSlots.length - 1)].hourLabel;
    bestWindowStr = `${startH} - ${endH}`;
  }

  // 4. Calculate Risk Score Breakdown
  const riskFactors: RiskFactorItem[] = [];
  let baseScore = 15;

  if ((current.precipitationProbability ?? 0) >= 60) {
    riskFactors.push({
      name: 'Rain Probability',
      points: 20,
      reason: `Elevated chance of precipitation (${Math.round(current.precipitationProbability!)}%)`,
    });
    baseScore += 20;
  } else if ((current.precipitationProbability ?? 0) >= 30) {
    riskFactors.push({
      name: 'Rain Probability',
      points: 10,
      reason: `Moderate shower likelihood (${Math.round(current.precipitationProbability!)}%)`,
    });
    baseScore += 10;
  }

  if (current.windSpeed >= 25) {
    riskFactors.push({
      name: 'Wind & Gusts',
      points: 15,
      reason: `Sustained wind of ${Math.round(current.windSpeed)} km/h may cause drift or shear`,
    });
    baseScore += 15;
  } else if (current.windSpeed >= 16) {
    riskFactors.push({
      name: 'Wind Speed',
      points: 8,
      reason: `Breezy conditions (${Math.round(current.windSpeed)} km/h)`,
    });
    baseScore += 8;
  }

  if (current.temperature >= 38) {
    riskFactors.push({
      name: 'Extreme Heat',
      points: 18,
      reason: `Ambient temperature reached ${Math.round(current.temperature)}°C`,
    });
    baseScore += 18;
  } else if (current.temperature >= 34) {
    riskFactors.push({
      name: 'Elevated Temperature',
      points: 10,
      reason: `Warm conditions (${Math.round(current.temperature)}°C)`,
    });
    baseScore += 10;
  }

  if (activeAlert) {
    const alertPts = activeAlert.severity === 'RED' ? 30 : activeAlert.severity === 'ORANGE' ? 20 : 10;
    riskFactors.push({
      name: `Official IMD Alert (${activeAlert.severity})`,
      points: alertPts,
      reason: activeAlert.event,
    });
    baseScore += alertPts;
  }

  const finalScore = Math.min(Math.max(baseScore, 10), 95);
  let riskLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  if (finalScore >= 75) riskLevel = 'Critical';
  else if (finalScore >= 55) riskLevel = 'High';
  else if (finalScore >= 35) riskLevel = 'Moderate';
  else if (finalScore >= 20) riskLevel = 'Low';
  else riskLevel = 'Very Low';

  const riskScore: RiskScoreBreakdown = {
    score: finalScore,
    level: riskLevel,
    summary:
      riskLevel === 'Critical' || riskLevel === 'High'
        ? 'Heightened operational weather risks. Follow precautionary field protocols.'
        : riskLevel === 'Moderate'
        ? 'Moderate weather factors detected. Align activities with favorable time windows.'
        : 'Favorable operational weather environment. Normal workflows supported.',
    factors: riskFactors,
  };

  // 5. Generate Sector-Specific Advisories
  let overallStatus: OperationalStatus = 'favorable';
  if (finalScore >= 65 || activeAlert?.severity === 'RED') overallStatus = 'high_risk';
  else if (finalScore >= 40 || activeAlert?.severity === 'ORANGE') overallStatus = 'caution';

  const statusMap: Record<OperationalStatus, { label: string; color: string }> = {
    favorable: { label: '• Favorable Conditions', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    caution: { label: '• Caution Required', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    high_risk: { label: '• High Operational Risk', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    critical: { label: '• Critical Warning', color: 'bg-red-100 text-red-900 border-red-300' },
  };

  let primaryDirective = '';
  let recommendations: OperationalRecommendation[] = [];
  let recommendedActions: string[] = [];
  let avoidActions: string[] = [];

  // ==========================================
  // SECTOR 1: AGRICULTURE (Matching Image 2)
  // ==========================================
  if (sectorId === 'agriculture') {
    const willRain = analysis?.willRain || (current.precipitationProbability ?? 0) >= 45;
    const peakWindow = analysis?.peakRainWindow || '14:00 - 18:00';

    if (willRain) {
      primaryDirective = `Rain likely during ${peakWindow}. Prioritize harvesting and foliar application prior to 13:00 IST. Secure open grain bags.`;
    } else if (current.temperature >= 38) {
      primaryDirective = `Elevated heat stress anticipated midday (${Math.round(current.temperature)}°C). Schedule irrigation during early morning hours and avoid foliar chemical sprays during peak solar hours.`;
    } else {
      primaryDirective = `Good conditions for field activities today. Optimal window for harvesting, mechanized tillage, and foliar application prior to 14:00 IST.`;
    }

    const isRainy = (current.precipitationProbability ?? 0) >= 50 || (analysis?.totalExpectedRainMm ?? 0) >= 3;
    const isWindy = current.windSpeed >= 15;

    recommendations = [
      {
        id: 'irrigation',
        title: 'Irrigation Regimen',
        badge: isRainy ? 'Delay / Avoid' : 'Recommended',
        badgeColor: isRainy ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: isRainy
          ? `Pause micro-irrigation. Natural precipitation window anticipated (${analysis?.totalExpectedRainMm ?? 4}mm) will replenish topsoil moisture.`
          : `Moderate micro-irrigation advised during early morning. Soil moisture index is optimal for drip application.`,
        subMetricLabel: 'Best window',
        subMetricValue: bestWindowStr,
        whyReason: {
          factorName: 'Precipitation Forecast & Rain Probability',
          currentValue: `${Math.round(current.precipitationProbability ?? 0)}% chance (${(analysis?.totalExpectedRainMm ?? 0).toFixed(1)} mm)`,
          thresholdValue: '> 50% probability or > 3mm expected rainfall',
          operationalEffect: isRainy ? 'Avoid waterlogging and nitrogen leaching' : 'Maintain root-zone moisture tension',
          scientificReason: 'Irrigating before heavy rain leads to soil compaction, runoff waste, and root asphyxiation in standing crops.',
        },
      },
      {
        id: 'pest_spray',
        title: 'Pest & Spray Operations',
        badge: isWindy || isRainy ? 'Precaution' : 'Recommended',
        badgeColor: isWindy || isRainy ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: isWindy
          ? `Pause chemical spraying post-noon. Wind speeds (${Math.round(current.windSpeed)} km/h) risk spray drift across neighboring parcels.`
          : isRainy
          ? `Complete foliar sprays before rain onset (${peakWindow}) to prevent pesticide wash-off.`
          : `Optimal calm conditions for foliar nutrient sprays and biological pest management.`,
        subMetricLabel: 'Relative Drift',
        subMetricValue: isWindy ? 'High (Breezy)' : 'Low (Calm)',
        whyReason: {
          factorName: 'Sustained Wind Speed & Droplet Drift',
          currentValue: `${Math.round(current.windSpeed)} km/h (Gusts: ${Math.round(current.windGusts || current.windSpeed)} km/h)`,
          thresholdValue: 'Optimal: 3-12 km/h; Avoid: > 15 km/h',
          operationalEffect: 'High winds cause airborne droplet drift; rainfall washes systemic compounds into ground.',
          scientificReason: 'Chemical droplet dispersion efficiency decreases by over 45% when wind exceeds 15 km/h, reducing target efficacy and polluting non-target zones.',
        },
      },
      {
        id: 'tillage',
        title: 'Mechanized Tillage',
        badge: isRainy ? 'Caution: Wet Soil' : 'Optimal: 08-11 AM',
        badgeColor: isRainy ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: isRainy
          ? 'Soil compaction index is elevated due to moisture. Limit heavy machinery to prevent subsoil pan formation.'
          : 'Soil moisture and compaction index are normal. Good for combine-harvester and seed-drill mobilization.',
        subMetricLabel: 'Operating Feasibility',
        subMetricValue: isRainy ? 'Moderate (70%)' : 'High (92%)',
        whyReason: {
          factorName: 'Topsoil Moisture & Tractor Traction',
          currentValue: `${Math.round(current.humidity)}% RH / ${(analysis?.totalExpectedRainMm ?? 0).toFixed(1)}mm rain`,
          thresholdValue: 'Dry to damp surface soil (moisture tension < 30 kPa)',
          operationalEffect: 'Prevents wheel slip and excessive fuel consumption',
          scientificReason: 'Operating heavy tractors on over-saturated soil causes deep ruts and smearing, degrading soil aggregate structure for subsequent root growth.',
        },
      },
      {
        id: 'harvest_rain',
        title: 'Convective Rain Risk',
        badge: isRainy ? 'Evening Alert' : 'Favorable',
        badgeColor: isRainy ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        description: isRainy
          ? `Moderate isolated showers anticipated (${peakWindow}). Secure harvested grains, cover open threshing floors, and clean mandi drainage channels.`
          : 'Clear skies favorable for grain drying and outdoor harvest storage. Negligible precipitation risk.',
        subMetricLabel: 'Rain Probability',
        subMetricValue: `${Math.round(current.precipitationProbability ?? 20)}%`,
        whyReason: {
          factorName: 'Atmospheric Convection & Radar Reflectivity',
          currentValue: `${Math.round(current.precipitationProbability ?? 0)}% peak probability`,
          thresholdValue: '> 40% probability of convective showers',
          operationalEffect: 'Moisture spoilage and fungal aflatoxin risk on unbagged produce',
          scientificReason: 'Uncovered cereal grains exposed to sudden showers absorb moisture rapidly, increasing post-harvest microbial rot and lowering market grade quality.',
        },
      },
    ];

    recommendedActions = [
      'Carry out foliar spraying and weeding in the early morning calm window',
      'Inspect field bunds and ensure surface drainage ditches are cleared of weeds',
      'Store harvested produce on elevated tarpaulins in ventilated sheds',
    ];
    avoidActions = [
      'Avoid spraying insecticides in high midday wind or immediately preceding showers',
      'Do not apply granular urea or nitrogen fertilizer if heavy rain is imminent',
      'Avoid moving heavy tillage tractors over waterlogged parcel borders',
    ];
  }

  // ==========================================
  // SECTOR 2: AVIATION
  // ==========================================
  else if (sectorId === 'aviation') {
    const isLowVis = (current.visibility || 6) < 4;
    const isHighWind = current.windSpeed >= 25 || (current.windGusts || 0) >= 35;
    const isStormy = current.weatherCode >= 95;

    primaryDirective = isStormy
      ? 'Convective thunderstorm activity detected. Aerodrome operations on high advisory; prepare for holding patterns and runway switch.'
      : isLowVis
      ? `Reduced horizontal visibility (${Math.round(current.visibility || 4)} km). Enforce CAT-I/II IFR operational parameters for arrivals and departures.`
      : isHighWind
      ? `Strong surface winds (${Math.round(current.windSpeed)} km/h, gusting ${Math.round(current.windGusts || 35)} km/h). Monitor runway crosswind component.`
      : 'Standard Visual Flight Rules (VFR) in effect. Surface winds and cloud ceiling within nominal aerodrome thresholds.';

    recommendations = [
      {
        id: 'flight_risk',
        title: 'Aerodrome Flight Weather Risk',
        badge: isStormy ? 'High Risk' : isLowVis || isHighWind ? 'Caution' : 'Normal',
        badgeColor: isStormy ? 'bg-rose-100 text-rose-800' : isLowVis || isHighWind ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Terminal airspace operational conditions for ${location.name}. Cloud ceiling and runway visual range nominal for commercial schedules.`,
        subMetricLabel: 'Ceiling / Base',
        subMetricValue: isLowVis ? 'Scattered 1500ft' : 'Broken 4000ft',
        whyReason: {
          factorName: 'Ground Visibility & Cloud Ceiling',
          currentValue: `${current.visibility || 6} km visibility`,
          thresholdValue: 'VFR min: 5 km; IFR min: 1.5 km',
          operationalEffect: 'Approach speed and glide path spacing adjustments',
          scientificReason: 'Low visibility requires augmented instrument separation minima, reducing runway landing acceptance rates by up to 30%.',
        },
      },
      {
        id: 'crosswind',
        title: 'Runway Crosswind & Shear',
        badge: isHighWind ? 'Advisory: Gusts' : 'Favorable',
        badgeColor: isHighWind ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Sustained surface wind at ${Math.round(current.windSpeed)} km/h. Peak gust factor reaches ${Math.round(current.windGusts || current.windSpeed * 1.3)} km/h.`,
        subMetricLabel: 'Crosswind Comp.',
        subMetricValue: `${Math.round(current.windSpeed * 0.7)} kt`,
        whyReason: {
          factorName: 'Surface Wind Speed & Gust Vector',
          currentValue: `${Math.round(current.windSpeed)} km/h`,
          thresholdValue: 'Commercial aircraft limit: 20-30 kt crosswind',
          operationalEffect: 'Rudder authority demand during flare and roll-out',
          scientificReason: 'Sudden gust fronts generate asymmetric wing lift differentials, requiring rapid pilot control inputs to avoid runway excursions.',
        },
      },
      {
        id: 'thunderstorm',
        title: 'Convective Cell & Microburst Risk',
        badge: isStormy ? 'Active Storm' : (current.precipitationProbability ?? 0) > 50 ? 'Moderate' : 'Low Risk',
        badgeColor: isStormy ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        description: 'Doppler echo diagnostics for microburst shear and terminal lightning hazards.',
        subMetricLabel: 'Convective Potential',
        subMetricValue: isStormy ? 'High (Cells < 20km)' : 'Low',
        whyReason: {
          factorName: 'Atmospheric Instability & Weather Code',
          currentValue: current.conditionText,
          thresholdValue: 'Weather codes 95-99 (Thunderstorm)',
          operationalEffect: 'Rerouting around terminal convective cells',
          scientificReason: 'Strong downdrafts within cumulonimbus cells produce dangerous low-altitude wind shear capable of compromising aircraft energy states.',
        },
      },
      {
        id: 'optimal_window',
        title: 'Terminal Operational Window',
        badge: 'Optimal Window',
        badgeColor: 'bg-blue-100 text-blue-800',
        description: `Recommended schedule departure window with lowest turbulence and optimal visibility.`,
        subMetricLabel: 'Calmest Window',
        subMetricValue: bestWindowStr,
        whyReason: {
          factorName: 'Diurnal Convective Heating Cycle',
          currentValue: 'Morning boundary layer stability',
          thresholdValue: 'Pre-noon thermal heating onset',
          operationalEffect: 'Smoother departure climb and lower fuel burn in calm air',
          scientificReason: 'Solar thermal heating generates thermals and turbulence post-noon; early morning flights experience stable laminar atmospheric conditions.',
        },
      },
    ];

    recommendedActions = [
      'Maintain updated aerodrome ATIS / METAR monitoring for rapid gust shifts',
      'Verify fuel reserve margins in the event of approach hold delays',
      'Review alternate airport runway conditions within 250 nautical miles',
    ];
    avoidActions = [
      'Avoid tight turn-around schedules during peak convective shower windows',
      'Do not dispatch light training aircraft if crosswind gusts exceed 15 knots',
    ];
  }

  // ==========================================
  // SECTOR 3: MARINE & FISHERIES
  // ==========================================
  else if (sectorId === 'marine') {
    const isRough = current.windSpeed >= 28 || (current.precipitationProbability ?? 0) >= 60;

    primaryDirective = isRough
      ? 'Advisory for artisanal boats and coastal trawlers: Surface winds exceeding 28 km/h. Fishermen advised not to venture into deep sea.'
      : 'Fair marine weather. Coastal waters calm to slight. Suitable for near-shore and artisanal fishing operations.';

    recommendations = [
      {
        id: 'marine_surface',
        title: 'Coastal Surface Wind Risk',
        badge: isRough ? 'Caution: Rough' : 'Calm to Slight',
        badgeColor: isRough ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Sustained coastal winds at ${Math.round(current.windSpeed)} km/h. Small craft advisory threshold is 30 km/h.`,
        subMetricLabel: 'Beaufort Force',
        subMetricValue: current.windSpeed > 28 ? 'Force 5 (Fresh)' : 'Force 3 (Gentle)',
        whyReason: {
          factorName: 'Wind Speed & Wave Drag',
          currentValue: `${Math.round(current.windSpeed)} km/h`,
          thresholdValue: 'Small craft warning: > 28 km/h',
          operationalEffect: 'Vessel pitch and roll stability for small catamarans and motorized crafts',
          scientificReason: 'Sustained offshore winds quickly generate steep, short-period chop that threatens small open-deck fishing vessels.',
        },
      },
      {
        id: 'storm_period',
        title: 'Coastal Squall & Lightning Threat',
        badge: (current.precipitationProbability ?? 0) > 40 ? 'Watch: Squalls' : 'Low Risk',
        badgeColor: (current.precipitationProbability ?? 0) > 40 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: 'Sudden gust front acceleration associated with passing maritime showers.',
        subMetricLabel: 'Squall Likelihood',
        subMetricValue: `${Math.round(current.precipitationProbability ?? 20)}%`,
        whyReason: {
          factorName: 'Marine Precipitation Probability',
          currentValue: `${Math.round(current.precipitationProbability ?? 0)}%`,
          thresholdValue: '> 40% probability',
          operationalEffect: 'Sudden visibility loss and boat drifting away from coastline',
          scientificReason: 'Maritime squalls can drop visibility to near zero and shift wind direction 180 degrees in minutes, disorienting navigators without radar.',
        },
      },
      {
        id: 'fishing_window',
        title: 'Optimal Fishing Harbor Window',
        badge: 'Safe Window',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        description: 'Recommended timeframe for harbor departure and safe coastal return.',
        subMetricLabel: 'Safe Departure',
        subMetricValue: bestWindowStr,
        whyReason: {
          factorName: 'Diurnal Land-Sea Breeze Dynamics',
          currentValue: 'Early morning offshore light breeze',
          thresholdValue: 'Pre-monsoon afternoon thermal onshore gale',
          operationalEffect: 'Fuel efficiency and safe harbor entry before swell peaks',
          scientificReason: 'Early mornings benefit from offshore land breezes allowing easy boat exit before the stronger onshore sea breeze builds wave chop in the afternoon.',
        },
      },
      {
        id: 'safety_directive',
        title: 'Life Safety Directive',
        badge: 'Mandatory Check',
        badgeColor: 'bg-blue-100 text-blue-800',
        description: 'Ensure VHF radio channel 16 is tuned, lifejackets are worn, and GPS distress beacons are functional.',
        subMetricLabel: 'Emergency Protocol',
        subMetricValue: 'INCOIS NavTex Active',
        whyReason: {
          factorName: 'Safety Equipment Readiness',
          currentValue: 'Coastal fleet operational protocol',
          thresholdValue: '100% lifejacket wear compliance',
          operationalEffect: 'Rapid distress localization in the event of engine failure',
          scientificReason: 'Over 80% of marine fishing casualties occur due to lack of personal flotation devices during sudden squall overturns.',
        },
      },
    ];

    recommendedActions = [
      'Maintain continuous listening watch on VHF marine emergency channels',
      'Fish in clusters within line-of-sight of companion craft',
      'Return to harbor if dark towering convective clouds appear on the horizon',
    ];
    avoidActions = [
      'Do not venture beyond 10 nautical miles if small craft warnings are active',
      'Never operate single-engine boats without functioning reserve paddles and PFDs',
    ];
  }

  // ==========================================
  // SECTOR 4: DISASTER MANAGEMENT
  // ==========================================
  else if (sectorId === 'disaster') {
    const isSevere = activeAlert?.severity === 'RED' || (analysis?.totalExpectedRainMm ?? 0) >= 30;
    const isModerate = activeAlert?.severity === 'ORANGE' || (analysis?.totalExpectedRainMm ?? 0) >= 15;

    primaryDirective = isSevere
      ? `High-priority disaster readiness alert in effect. Intense rainfall expected (${Math.round(analysis?.totalExpectedRainMm ?? 35)} mm). Pre-position dewatering pumps and alert SDRF/NDRF rescue teams in low-lying pockets.`
      : isModerate
      ? `Advisory alert active for ${location.name}. Monitor stormwater channels and high-risk underpasses for localized water accumulation.`
      : 'Normal civil protection status. No extreme hydrological or meteorological threats active across the district.';

    recommendations = [
      {
        id: 'inundation',
        title: 'Urban Waterlogging & Flash Runoff',
        badge: isSevere ? 'High Risk' : isModerate ? 'Moderate Watch' : 'Low Risk',
        badgeColor: isSevere ? 'bg-rose-100 text-rose-800' : isModerate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Total 24h expected rain: ${(analysis?.totalExpectedRainMm ?? 0).toFixed(1)} mm. Runoff index for paved municipal zones.`,
        subMetricLabel: 'Runoff Stress',
        subMetricValue: isSevere ? 'Critical (Overload)' : 'Manageable',
        whyReason: {
          factorName: 'Precipitation Intensity & Total Expected Rain',
          currentValue: `${(analysis?.totalExpectedRainMm ?? 0).toFixed(1)} mm expected`,
          thresholdValue: 'Urban drainage threshold: > 25 mm/24h or > 15 mm/hr',
          operationalEffect: 'Roadway inundation and vehicular stranding in underpasses',
          scientificReason: 'Impervious urban concrete prevents natural infiltration, converting 85% of intense rainfall into immediate surface surge that exceeds municipal culvert diameters.',
        },
      },
      {
        id: 'structural',
        title: 'High Wind & Structural Hazards',
        badge: current.windSpeed > 25 ? 'Advisory: Wind' : 'Stable',
        badgeColor: current.windSpeed > 25 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Sustained wind at ${Math.round(current.windSpeed)} km/h. Gusts up to ${Math.round(current.windGusts || current.windSpeed)} km/h may dislodge weak hoardings and tin roofs.`,
        subMetricLabel: 'Peak Gust Factor',
        subMetricValue: `${Math.round(current.windGusts || current.windSpeed * 1.3)} km/h`,
        whyReason: {
          factorName: 'Peak Wind Gust Pressure',
          currentValue: `${Math.round(current.windGusts || current.windSpeed)} km/h`,
          thresholdValue: 'Structural damage threshold: > 45 km/h',
          operationalEffect: 'Falling tree branches, downed electrical wires, and billboard collapse',
          scientificReason: 'Aerodynamic drag pressure increases with the square of wind velocity; gust spikes create torsional fatigue on roadside signage and overhead power infrastructure.',
        },
      },
      {
        id: 'relief_staging',
        title: 'Emergency Relief Staging Readiness',
        badge: isSevere ? 'Active Staging' : 'Routine Standby',
        badgeColor: isSevere ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800',
        description: 'Logistical staging status for municipal quick response teams, emergency shelters, and medical stocks.',
        subMetricLabel: 'Response Readiness',
        subMetricValue: isSevere ? 'Stage 2 (Deployment)' : 'Stage 1 (Normal)',
        whyReason: {
          factorName: 'Multi-Hazard Severity Index',
          currentValue: activeAlert ? activeAlert.severity : 'Normal',
          thresholdValue: 'IMD Orange/Red Alert trigger',
          operationalEffect: 'Readiness of heavy earthmovers and emergency power backup generators',
          scientificReason: 'Early prepositioning of disaster assets cuts emergency response latency by over 60% when urban arteries become impassable during sudden deluges.',
        },
      },
      {
        id: 'official_alert_card',
        title: 'Official IMD / NDMA Multi-Hazard Feed',
        badge: activeAlert ? `${activeAlert.severity} Alert` : 'Clear',
        badgeColor: activeAlert?.severity === 'RED' ? 'bg-red-100 text-red-900' : activeAlert ? 'bg-orange-100 text-orange-900' : 'bg-emerald-100 text-emerald-800',
        description: activeAlert ? activeAlert.description.slice(0, 110) : 'No official severe meteorological warnings active for this district.',
        subMetricLabel: 'Authoritative Source',
        subMetricValue: activeAlert ? activeAlert.source : 'IMD Mausam Bulletin',
        whyReason: {
          factorName: 'CAP Government Alert Protocol',
          currentValue: activeAlert ? activeAlert.event : 'No Active Bulletin',
          thresholdValue: 'Statutory IMD Warning Level',
          operationalEffect: 'Mandatory district administration advisory actions',
          scientificReason: 'Official IMD bulletins synthesize Doppler radar, satellite imagery, and high-resolution numerical models verified by regional meteorological forecasting centers.',
        },
      },
    ];

    recommendedActions = [
      'Inspect urban water outfalls and clear debris from primary storm culverts',
      'Test emergency wireless VHF communication and backup diesel generator fuel levels',
      'Keep municipal disaster control room staffed 24x7 during warning periods',
    ];
    avoidActions = [
      'Do not allow vehicular traffic through un-monitored railway underpasses during heavy rain',
      'Avoid standing or parking vehicles under aged trees or temporary hoardings during squalls',
    ];
  }

  // ==========================================
  // SECTOR 5: PUBLIC HEALTH
  // ==========================================
  else if (sectorId === 'health') {
    const isExtremeHeat = current.temperature >= 40;
    const isHighHeat = current.temperature >= 35;
    const isVeryHumid = current.humidity >= 80;

    primaryDirective = isExtremeHeat
      ? `Extreme heat stress danger (${Math.round(current.temperature)}°C). High risk of heat exhaustion and heatstroke. Limit direct sun exposure between 12:00 and 16:00 IST; ensure frequent hydration.`
      : isHighHeat && isVeryHumid
      ? `High humidity (${Math.round(current.humidity)}%) combined with temperature (${Math.round(current.temperature)}°C) creates elevated thermal discomfort. Heavy physical labor should be scheduled before 10:00 IST.`
      : 'Biometeorological parameters within comfortable limits. Outdoor exercise and routine activities supported with normal hydration.';

    recommendations = [
      {
        id: 'heat_index',
        title: 'Heat Index & Biometeorology',
        badge: isExtremeHeat ? 'Dangerous' : isHighHeat ? 'Caution: Heat' : 'Comfortable',
        badgeColor: isExtremeHeat ? 'bg-rose-100 text-rose-800' : isHighHeat ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Apparent temperature feels like ${Math.round(current.feelsLike)}°C. Physiological heat dissipation is restricted when humidity is high.`,
        subMetricLabel: 'Apparent Temp',
        subMetricValue: `${Math.round(current.feelsLike)}°C`,
        whyReason: {
          factorName: 'Combined Temperature & Relative Humidity',
          currentValue: `${Math.round(current.temperature)}°C at ${Math.round(current.humidity)}% RH`,
          thresholdValue: 'Heat Index > 41°C (Dangerous)',
          operationalEffect: 'Elevated risk of heat cramps, dizziness, and cardiovascular strain',
          scientificReason: 'When relative humidity exceeds 70%, the evaporation rate of human perspiration plummets, impairing the core thermoregulatory cooling mechanism.',
        },
      },
      {
        id: 'uv_exposure',
        title: 'Solar UV Radiation Index',
        badge: (current.uvIndex ?? 6) >= 8 ? 'Very High UV' : (current.uvIndex ?? 6) >= 6 ? 'High UV' : 'Moderate',
        badgeColor: (current.uvIndex ?? 6) >= 8 ? 'bg-rose-100 text-rose-800' : (current.uvIndex ?? 6) >= 6 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Solar UV Index measures ${(current.uvIndex ?? 6).toFixed(1)}. Direct skin burn time is reduced during peak sun hours.`,
        subMetricLabel: 'Peak UV Window',
        subMetricValue: '11:00 - 15:00 IST',
        whyReason: {
          factorName: 'Solar Zenith & Ultraviolet Index',
          currentValue: `Index ${(current.uvIndex ?? 6).toFixed(1)}`,
          thresholdValue: 'UV Index > 6 requires protection; > 8 is severe',
          operationalEffect: 'Erythema (sunburn) and cumulative cellular epidermal damage',
          scientificReason: 'UV-B rays penetrate cloud layers during midday, causing photochemical damage to cellular DNA and accelerating cataract formation.',
        },
      },
      {
        id: 'exercise_window',
        title: 'Outdoor Physical Activity Window',
        badge: 'Recommended Window',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        description: 'Optimal timeframe for jogging, cycling, athletic training, and outdoor manual construction labor.',
        subMetricLabel: 'Best Hours',
        subMetricValue: '05:30 - 08:30 IST',
        whyReason: {
          factorName: 'Diurnal Minimum Temperature & Low Solar Angle',
          currentValue: `Morning low ~${Math.round(analysis?.tempMin24h ?? current.temperature - 5)}°C`,
          thresholdValue: 'Thermal comfort index < 28°C',
          operationalEffect: 'Optimal cardiac efficiency without excessive dehydration',
          scientificReason: 'Early morning air features the lowest wet-bulb globe temperature (WBGT) of the 24-hour cycle, preventing exertional heat illness during cardio exertion.',
        },
      },
      {
        id: 'vector_risk',
        title: 'Vector & Post-Rain Waterborne Risk',
        badge: (analysis?.totalExpectedRainMm ?? 0) > 5 ? 'Watch: Stagnation' : 'Low',
        badgeColor: (analysis?.totalExpectedRainMm ?? 0) > 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: 'Post-rain humidity creates conditions for mosquito breeding (Aedes / Anopheles) in stagnant surface puddles.',
        subMetricLabel: 'Vector Breeding Index',
        subMetricValue: current.humidity > 75 ? 'Moderate' : 'Low',
        whyReason: {
          factorName: 'Moisture Stagnation & Ambient Warmth',
          currentValue: `${Math.round(current.humidity)}% RH`,
          thresholdValue: 'Persistent humidity > 70% with temperature 24-32°C',
          operationalEffect: 'Accelerated mosquito larval reproduction cycle',
          scientificReason: 'High relative humidity combined with warm temperatures shortens the extrinsic incubation period of dengue and malaria pathogens within vector mosquitoes.',
        },
      },
    ];

    recommendedActions = [
      'Drink plenty of oral fluids (water, electrolyte solutions) throughout the day',
      'Wear wide-brimmed hats and apply broad-spectrum sunscreen when outdoors midday',
      'Schedule outdoor construction shifts during early morning and late evening',
    ];
    avoidActions = [
      'Avoid strenuous outdoor athletic training during peak thermal hours (12:00 - 16:00)',
      'Never leave children or vulnerable individuals unattended in parked vehicles',
    ];
  }

  // ==========================================
  // SECTOR 6: URBAN PLANNING & MUNICIPAL OPS
  // ==========================================
  else if (sectorId === 'urban') {
    const isHeavyRain = (analysis?.totalExpectedRainMm ?? 0) >= 20;

    primaryDirective = isHeavyRain
      ? `Heavy rainfall load forecasted (${Math.round(analysis?.totalExpectedRainMm ?? 25)} mm). Urban drainage systems may face localized surcharges. Deploy mobile suction pumps to vulnerable arterial underpasses.`
      : 'Nominal urban operational conditions. Municipal road resurfacing, building construction, and stormwater maintenance can proceed according to plan.';

    recommendations = [
      {
        id: 'drainage_stress',
        title: 'Storm-Drain Capacity Stress Indicator',
        badge: isHeavyRain ? 'High Stress' : 'Normal',
        badgeColor: isHeavyRain ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        description: `Hourly rainfall rate vs municipal culvert design thresholds. Expected rainfall: ${(analysis?.totalExpectedRainMm ?? 0).toFixed(1)} mm.`,
        subMetricLabel: 'Drainage Status',
        subMetricValue: isHeavyRain ? 'Surcharge Watch' : 'Nominal Discharge',
        whyReason: {
          factorName: 'Hydraulic Urban Runoff Inflow',
          currentValue: `${(analysis?.totalExpectedRainMm ?? 0).toFixed(1)} mm rain expected`,
          thresholdValue: 'Typical storm drain design: 15-20 mm/hr',
          operationalEffect: 'Backwater flow in arterial road gullies',
          scientificReason: 'High intensity convective rain spikes overwhelm pipe gravity discharge capacity, converting paved street profiles into temporary surface drainage channels.',
        },
      },
      {
        id: 'concrete_curing',
        title: 'Concrete Curing & Masonry Window',
        badge: isHeavyRain ? 'Avoid Pouring' : 'Favorable',
        badgeColor: isHeavyRain ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        description: `Environmental suitability for ready-mix concrete pouring, plastering, and structural masonry.`,
        subMetricLabel: 'Curing Suitability',
        subMetricValue: isHeavyRain ? 'Poor (Wash-off)' : 'High (95%)',
        whyReason: {
          factorName: 'Ambient Temperature, Rain & Humidity',
          currentValue: `${Math.round(current.temperature)}°C / ${Math.round(current.humidity)}% RH`,
          thresholdValue: 'Optimal: 15-32°C, no rain during 6h initial set',
          operationalEffect: 'Surface cement wash-out and weakened compressive strength',
          scientificReason: 'Rainwater falling on freshly placed uncured concrete alters the designed water-cement ratio, creating surface micro-cracks and compromising design strength.',
        },
      },
      {
        id: 'heat_island',
        title: 'Urban Heat Island (UHI) Index',
        badge: current.temperature > 36 ? 'Elevated UHI' : 'Moderate',
        badgeColor: current.temperature > 36 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: 'Nighttime thermal radiation retention across dense asphalt and high-density concrete corridors.',
        subMetricLabel: 'Night Cooling Delay',
        subMetricValue: `+2.5°C over rural baseline`,
        whyReason: {
          factorName: 'Thermal Mass & Building Surface Absorption',
          currentValue: `${Math.round(current.temperature)}°C ambient`,
          thresholdValue: 'Daytime surface heating > 35°C',
          operationalEffect: 'Prolonged nighttime cooling demand and pedestrian thermal stress',
          scientificReason: 'Dark bitumen pavement and concrete structures store incoming solar radiation during the day, re-radiating longwave thermal infrared heat through the night.',
        },
      },
      {
        id: 'waste_ops',
        title: 'Municipal Solid Waste & Landfill Ops',
        badge: isHeavyRain ? 'Caution: Leachate' : 'Normal',
        badgeColor: isHeavyRain ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: 'Compaction, open waste transport, and leachate containment pond monitoring.',
        subMetricLabel: 'Leachate Control',
        subMetricValue: isHeavyRain ? 'Spillway Watch' : 'Controlled',
        whyReason: {
          factorName: 'Rainfall Percolation in Open Landfills',
          currentValue: `${(analysis?.totalExpectedRainMm ?? 0).toFixed(1)} mm`,
          thresholdValue: 'Heavy rain (> 20mm) generates rapid leachate surge',
          operationalEffect: 'Contamination of surrounding groundwater tables',
          scientificReason: 'Excess moisture filtering through uncompacted organic landfill waste dissolves chemical contaminants, producing toxic leachate requiring containment.',
        },
      },
    ];

    recommendedActions = [
      'Position dewatering pumps at known municipal depression points and railway subways',
      'Cover open gravel and sand stockyards to avoid stormwater sediment choking drains',
      'Conduct planned concrete casting during dry morning windows with curing blankets ready',
    ];
    avoidActions = [
      'Avoid fresh asphalt bitumen laying when surface moisture is present',
      'Do not perform road digging or open trench utility work immediately preceding rain',
    ];
  }

  // ==========================================
  // SECTOR 7: TRANSPORT & LOGISTICS
  // ==========================================
  else if (sectorId === 'transport') {
    const isFoggy = (current.visibility || 6) < 3;
    const isWetRoad = (current.precipitationProbability ?? 0) >= 45 || (analysis?.totalExpectedRainMm ?? 0) >= 3;

    primaryDirective = isFoggy
      ? `Dense fog / low visibility warning (${Math.round(current.visibility || 2)} km). Maintain reduced speed on national highways and enforce safe vehicle following distances.`
      : isWetRoad
      ? `Wet road conditions anticipated during ${analysis?.peakRainWindow || 'afternoon'}. Increased stopping distances and potential aquaplaning on expressways.`
      : 'Favorable road transport and arterial freight conditions. Highway transit corridors operating under nominal travel speeds.';

    recommendations = [
      {
        id: 'highway_risk',
        title: 'Highway Aquaplaning & Traction Risk',
        badge: isWetRoad ? 'Caution: Wet Pavement' : 'Favorable',
        badgeColor: isWetRoad ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Surface tire friction coefficient is reduced on wet pavement. Stopping distances increase by up to 40%.`,
        subMetricLabel: 'Pavement Friction',
        subMetricValue: isWetRoad ? 'Moderate (0.55)' : 'High (0.85)',
        whyReason: {
          factorName: 'Standing Water Film & Tire Tread Drainage',
          currentValue: isWetRoad ? 'Wet surface anticipated' : 'Dry asphalt',
          thresholdValue: 'Water film depth > 1.5 mm causes hydroplaning above 65 km/h',
          operationalEffect: 'Loss of steering traction and emergency braking distance extension',
          scientificReason: 'When vehicle tires encounter a layer of water thicker than tire tread grooves can evacuate, water pressure lifts the tire off the road, resulting in zero steering control.',
        },
      },
      {
        id: 'fog_corridors',
        title: 'Visibility & Fog Corridors',
        badge: isFoggy ? 'Dense Fog' : (current.visibility || 6) < 6 ? 'Haze' : 'Clear',
        badgeColor: isFoggy ? 'bg-rose-100 text-rose-800' : (current.visibility || 6) < 6 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `Ground horizontal visibility is ${Math.round(current.visibility || 6)} km. Fog corridors typically form along river basins and agricultural greenbelts.`,
        subMetricLabel: 'Visibility Range',
        subMetricValue: `${Math.round(current.visibility || 6)} km`,
        whyReason: {
          factorName: 'Relative Humidity & Particulate Radiation Cooling',
          currentValue: `${Math.round(current.humidity)}% RH / ${Math.round(current.visibility || 6)} km`,
          thresholdValue: 'Visibility < 1 km constitutes hazardous fog',
          operationalEffect: 'Speed reduction and fleet schedule delays',
          scientificReason: 'Radiational cooling of moisture-saturated air droplets near ground level produces suspended micro-droplets that scatter vehicle headlight beams.',
        },
      },
      {
        id: 'cold_chain',
        title: 'Cold-Chain & Thermal Freight Stress',
        badge: current.temperature > 36 ? 'High Thermal Load' : 'Stable',
        badgeColor: current.temperature > 36 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        description: 'Refrigerated container (reefer) cooling unit workload for dairy, vaccine, and perishable transit.',
        subMetricLabel: 'Thermal Enclosure Stress',
        subMetricValue: current.temperature > 36 ? 'High (+25% fuel)' : 'Normal',
        whyReason: {
          factorName: 'Solar Heat Gain & External Ambient Temp',
          currentValue: `${Math.round(current.temperature)}°C ambient`,
          thresholdValue: 'Ambient temp > 35°C stresses reefer compressor systems',
          operationalEffect: 'Increased fuel burn and cargo temperature fluctuation risk',
          scientificReason: 'High external thermal gradients increase conductive heat flux through refrigerated truck walls, requiring reefer engines to cycle at 100% capacity.',
        },
      },
      {
        id: 'fleet_dispatch',
        title: 'Optimal Fleet Transit Window',
        badge: 'Recommended Window',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        description: 'Recommended departure window to avoid peak convective rain and congested commuter corridors.',
        subMetricLabel: 'Clear Corridor',
        subMetricValue: bestWindowStr,
        whyReason: {
          factorName: 'Hourly Rain Probability & Traffic Synchronization',
          currentValue: 'Lowest convective risk window',
          thresholdValue: 'Pre-rain window avoids traffic gridlock',
          operationalEffect: 'On-time logistics delivery and lower accident probability',
          scientificReason: 'Dispatching heavy commercial trucks during verified calm weather windows minimizes collision risk and saves up to 15% transit fuel consumption.',
        },
      },
    ];

    recommendedActions = [
      'Ensure truck drivers activate low-beam headlights and maintain 4-second gap in fog',
      'Verify reefer temperature loggers before dispatching cold-chain pharmaceutical cargo',
      'Monitor highway police alerts for expressway traffic diversions',
    ];
    avoidActions = [
      'Avoid high-speed expressway transit during the peak shower window',
      'Do not overload high-sided container trucks in high crosswind corridors',
    ];
  }

  // ==========================================
  // SECTOR 8: ENERGY & POWER GRID
  // ==========================================
  else if (sectorId === 'energy') {
    const isPeakHeat = current.temperature >= 36;

    primaryDirective = isPeakHeat
      ? `High daytime temperature (${Math.round(current.temperature)}°C) driving elevated air conditioning cooling demand. Grid operators advised to secure reserve spinning capacity for midday peak surge.`
      : 'Power grid weather dynamics stable. Balanced domestic and commercial cooling load profile across regional distribution networks.';

    recommendations = [
      {
        id: 'cooling_demand',
        title: 'Cooling Demand & Peak Grid Surge',
        badge: isPeakHeat ? 'High Demand Spike' : 'Moderate',
        badgeColor: isPeakHeat ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        description: `Ambient heat drives commercial HVAC and residential split-AC load. Peak load window: 14:00 - 18:00 IST.`,
        subMetricLabel: 'Cooling Degree Demand',
        subMetricValue: isPeakHeat ? '+18% Peak Surge' : 'Baseline',
        whyReason: {
          factorName: 'Cooling Degree Index (CDD)',
          currentValue: `${Math.round(current.temperature)}°C (Feels ${Math.round(current.feelsLike)}°C)`,
          thresholdValue: 'Temperature > 34°C triggers non-linear AC power consumption',
          operationalEffect: 'Substation transformer thermal loading and peak power draw',
          scientificReason: 'Air conditioner compressors operate with reduced thermal efficiency at high ambient outdoor temperatures, demanding exponentially more electricity to transfer heat.',
        },
      },
      {
        id: 'solar_pv',
        title: 'Solar PV Generation Potential',
        badge: (current.uvIndex ?? 6) >= 7 ? 'High Solar Yield' : 'Moderate Yield',
        badgeColor: 'bg-amber-100 text-amber-800',
        description: `Solar irradiance index: ${(current.uvIndex ?? 6).toFixed(1)}. Optimal rooftop and utility-scale photovoltaic generation window: 10:00 - 15:00 IST.`,
        subMetricLabel: 'Solar Generation Index',
        subMetricValue: (current.uvIndex ?? 6) >= 7 ? '88% (Optimal)' : '65%',
        whyReason: {
          factorName: 'Global Horizontal Irradiance & Cloud Cover',
          currentValue: `UV Index ${(current.uvIndex ?? 6).toFixed(1)}`,
          thresholdValue: 'Clear sky irradiance > 750 W/m²',
          operationalEffect: 'Peak renewable feeding into distribution substations',
          scientificReason: 'Direct solar beam irradiance is highest during pre-monsoon clear skies, providing high renewable generation to offset afternoon cooling demand spikes.',
        },
      },
      {
        id: 'wind_power',
        title: 'Wind Farm Generation Conditions',
        badge: current.windSpeed >= 15 ? 'Good Generation' : 'Light Breeze',
        badgeColor: current.windSpeed >= 15 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700',
        description: `Hub-height wind speed estimate based on 10m surface winds (${Math.round(current.windSpeed)} km/h). Turbine cut-in velocity is ~11 km/h.`,
        subMetricLabel: 'Turbine Suitability',
        subMetricValue: current.windSpeed >= 12 ? 'Active Generation' : 'Below Rated Output',
        whyReason: {
          factorName: 'Wind Kinetic Energy & Power Curve',
          currentValue: `${Math.round(current.windSpeed)} km/h`,
          thresholdValue: 'Cut-in: 11 km/h (3 m/s); Rated: 43 km/h (12 m/s)',
          operationalEffect: 'Renewable grid synchronization and power dispatch scheduling',
          scientificReason: 'Wind turbine electrical power output scales with the cube of wind velocity, meaning even modest wind increases yield substantial power increases.',
        },
      },
      {
        id: 'transmission',
        title: 'Transmission Line Conductor Rating',
        badge: isPeakHeat ? 'Caution: Thermal Sag' : 'Normal',
        badgeColor: isPeakHeat ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        description: `High ambient heat and solar radiation reduce overhead high-voltage conductor thermal dissipation capacity.`,
        subMetricLabel: 'Line Thermal Margin',
        subMetricValue: isPeakHeat ? '90% Ampacity' : '100% Ampacity',
        whyReason: {
          factorName: 'Conductor Ambient Heat Dissipation',
          currentValue: `${Math.round(current.temperature)}°C`,
          thresholdValue: 'Ambient > 38°C with light wind increases thermal sag',
          operationalEffect: 'Risk of line elongation and ground clearance infringement',
          scientificReason: 'High-voltage aluminum conductors expand when carrying high current under high ambient temperatures, causing physical line sagging towards ground objects.',
        },
      },
    ];

    recommendedActions = [
      'Synchronize thermal and hydro peaking reserves ahead of the afternoon cooling surge',
      'Maximize solar farm inverter output during peak irradiance hours (10:00 - 14:00)',
      'Monitor distribution transformer oil temperatures in congested residential feeders',
    ];
    avoidActions = [
      'Avoid scheduled transmission line maintenance shutdowns during peak cooling load hours',
      'Do not defer substation capacitor bank switching during high inductive reactive load',
    ];
  }

  return {
    sector,
    location,
    status: overallStatus,
    statusLabel: statusMap[overallStatus].label,
    statusColor: statusMap[overallStatus].color,
    primaryDirective,
    recommendations,
    timeline,
    riskScore,
    weatherFactors,
    dopplerRadarStatus,
    recommendedActions,
    avoidActions,
    generatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    nwpSource: 'Open-Meteo NWP & IMD Warning Protocol',
  };
}

/**
 * Generates clean text and printable bulletin content for download / print
 */
export function formatAdvisoryBulletin(data: SectorAdvisoryData): string {
  const lines: string[] = [];
  lines.push('================================================================');
  lines.push(`WEATHERGPT OPERATIONAL SECTORAL BULLETIN`);
  lines.push(`SECTOR: ${data.sector.name.toUpperCase()} ADVISORY`);
  lines.push(`LOCATION: ${data.location.name}, ${data.location.country || 'India'}`);
  lines.push(`GENERATED: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${data.generatedAt} IST`);
  lines.push(`OPERATIONAL STATUS: ${data.statusLabel.replace(/^[^\w\s]+\s*/, '')}`);
  lines.push(`RISK SCORE: ${data.riskScore.score}/100 (${data.riskScore.level})`);
  lines.push('================================================================\n');

  lines.push(`PRIMARY DIRECTIVE:`);
  lines.push(`"${data.primaryDirective}"\n`);

  lines.push(`OPERATIONAL RECOMMENDATIONS:`);
  data.recommendations.forEach((rec, idx) => {
    lines.push(`${idx + 1}. ${rec.title} [${rec.badge}]`);
    lines.push(`   Guidance: ${rec.description}`);
    lines.push(`   Metric: ${rec.subMetricLabel}: ${rec.subMetricValue}`);
    lines.push(`   Why: ${rec.whyReason.scientificReason}\n`);
  });

  lines.push(`DETERMINISTIC WEATHER FACTORS:`);
  data.weatherFactors.forEach((f) => {
    lines.push(`- ${f.name}: ${f.value} (${f.statusLabel || 'Normal'})`);
  });
  lines.push('\n');

  lines.push(`RECOMMENDED ACTIONS:`);
  data.recommendedActions.forEach((a) => lines.push(`[✓] ${a}`));
  lines.push('\n');

  lines.push(`ACTIONS TO AVOID:`);
  data.avoidActions.forEach((a) => lines.push(`[✕] ${a}`));
  lines.push('\n');

  lines.push(`DATA SOURCES & METHODOLOGY:`);
  lines.push(`- High-Resolution NWP Weather Forecast: Open-Meteo Engine`);
  lines.push(`- Official Disaster & Meteorological Warnings: India Meteorological Department (IMD) / NDMA`);
  lines.push(`- Algorithmic Decision Engine: WeatherGPT Operational Rules Matrix`);
  lines.push('================================================================');

  return lines.join('\n');
}
