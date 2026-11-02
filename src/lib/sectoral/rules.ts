import { SectorId, SectorMeta } from './types';

export const SECTOR_CATALOG: SectorMeta[] = [
  {
    id: 'agriculture',
    name: 'Agriculture',
    iconName: 'Sprout',
    tag: 'Agro-Met / ICAR',
    description: 'Crop hydration, spraying intervals, and harvest protection guidance.',
    modelAttribution: 'Agro-Met WRF-NCMRWF & IMD Agro Advisory',
  },
  {
    id: 'aviation',
    name: 'Aviation',
    iconName: 'Plane',
    tag: 'METAR / TAF',
    description: 'Runway crosswinds, convective shear, microburst risk and cloud ceiling limits.',
    modelAttribution: 'Aviation Met NWP & Aerodrome Climatology',
  },
  {
    id: 'marine',
    name: 'Marine & Fisheries',
    iconName: 'Anchor',
    tag: 'INCOIS Feed',
    description: 'Significant wave height, swell periodicity, surface roughness, and harbor safe windows.',
    modelAttribution: 'Coastal Marine Surface Wind & IMD Coastal Alerts',
  },
  {
    id: 'disaster',
    name: 'Disaster Management',
    iconName: 'ShieldAlert',
    tag: 'NDRF Alerting',
    description: 'Urban waterlogging threats, flash floods, cyclone tracks and relief staging.',
    modelAttribution: 'IMD & NDMA Sachet Multi-Hazard Protocol',
  },
  {
    id: 'health',
    name: 'Public Health',
    iconName: 'HeartPulse',
    tag: 'AQI - Bio-Met',
    description: 'Wet-bulb temperature, heat index, PM2.5 dispersion, and vector risks.',
    modelAttribution: 'Biometeorology Heat Index & NOAA Wet-Bulb Guidelines',
  },
  {
    id: 'urban',
    name: 'Urban Planning',
    iconName: 'Building2',
    tag: 'Municipal Ops',
    description: 'Storm-drain capacity thresholds, heat island mitigation, and concrete curing limits.',
    modelAttribution: 'Urban Hydrology & Municipal Drainage Diagnostics',
  },
  {
    id: 'transport',
    name: 'Transport & Logistics',
    iconName: 'Truck',
    tag: 'NHAI Highway Corridors',
    description: 'Fog corridors, aquaplaning risks along arterial corridors, and cold-chain thermal stress.',
    modelAttribution: 'Highway Surface Met & Corridor Transit Diagnostics',
  },
  {
    id: 'energy',
    name: 'Energy',
    iconName: 'Zap',
    tag: 'POSOCO Grid',
    description: 'Solar irradiance forecast, wind farm yields, and peak cooling demand spikes.',
    modelAttribution: 'Grid Load Weather Forecast & Renewable Energy Index',
  },
];

export function getSectorMeta(id: SectorId): SectorMeta {
  return (
    SECTOR_CATALOG.find((s) => s.id === id) || SECTOR_CATALOG[0]
  );
}
