import {
  LayoutDashboard,
  Sparkles,
  SunMedium,
  Compass,
  AlertTriangle,
  History,
  Briefcase,
  Wheat,
  Plane,
  Anchor,
  ShieldAlert,
  HeartPulse,
  Building2,
  Truck,
  Zap,
  LucideIcon,
} from 'lucide-react';
import { SectorId } from '@/lib/sectoral/types';
import { SupportedLanguage } from '@/lib/i18n/types';

export interface SearchDestination {
  id: string;
  tabId: string;
  sectorId?: SectorId;
  icon: LucideIcon;
  category: 'core' | 'sector';
  titles: Partial<Record<SupportedLanguage, string>> & { en: string };
  subtitles: Partial<Record<SupportedLanguage, string>> & { en: string };
  keywords: string[];
}

export const SEARCH_DESTINATIONS: SearchDestination[] = [
  // Core Navigation
  {
    id: 'nav-dashboard',
    tabId: 'dashboard',
    icon: LayoutDashboard,
    category: 'core',
    titles: {
      en: 'Dashboard',
      hi: 'डैशबोर्ड',
      mr: 'डॅशबोर्ड',
    },
    subtitles: {
      en: 'Live overview, current weather metrics & quick alerts',
      hi: 'लाइव अवलोकन, वर्तमान मौसम मेट्रिक्स व त्वरित अलर्ट',
      mr: 'थेट आढावा, सद्य हवामान निर्देशक व जलद इशारे',
    },
    keywords: ['dashboard', 'home', 'main', 'overview', 'summary', 'डैशबोर्ड', 'डॅशबोर्ड', 'होम'],
  },
  {
    id: 'nav-ask-weathergpt',
    tabId: 'ask-weathergpt',
    icon: Sparkles,
    category: 'core',
    titles: {
      en: 'Ask WeatherGPT',
      hi: 'WeatherGPT से पूछें',
      mr: 'WeatherGPT ला विचारा',
    },
    subtitles: {
      en: 'Conversational AI meteorologist with verified live data',
      hi: 'सत्यापित लाइव डेटा के साथ संवादात्मक AI मौसम सहायक',
      mr: 'सत्यापित थेट डेटासह संवादात्मक AI हवामान सहाय्यक',
    },
    keywords: ['ask', 'chatbot', 'ai', 'weathergpt', 'question', 'chat', 'assistant', 'gpt', 'पूछें', 'विचारा', 'प्रश्न', 'संवाद'],
  },
  {
    id: 'nav-forecast',
    tabId: 'forecast',
    icon: SunMedium,
    category: 'core',
    titles: {
      en: 'Weather Forecast',
      hi: 'मौसम पूर्वानुमान',
      mr: 'हवामान अंदाज',
    },
    subtitles: {
      en: '24-hour hourly trend & 7-day detailed meteorological forecast',
      hi: '24-घंटे का प्रति घंटा रुझान और 7-दिवसीय विस्तृत पूर्वानुमान',
      mr: '२४ तासांचा तासागणिक कल व ७ दिवसांचा सविस्तर हवामान अंदाज',
    },
    keywords: ['forecast', 'prediction', 'weather forecast', 'tomorrow', 'upcoming weather', 'temperature forecast', '7-day', 'hourly', 'पूर्वानुमान', 'अंदाज', 'तापमान'],
  },
  {
    id: 'nav-maps',
    tabId: 'maps',
    icon: Compass,
    category: 'core',
    titles: {
      en: 'Weather Maps',
      hi: 'मौसम मानचित्र',
      mr: 'हवामान नकाशे',
    },
    subtitles: {
      en: 'Interactive radar: Satellite, Rainfall, Temp & Wind',
      hi: 'इंटरएक्टिव रडार लेयर्स: उपग्रह, वर्षा, तापमान और हवा',
      mr: 'संवादात्मक रडार स्तर: उपग्रह, पाऊस, तापमान आणि वारा',
    },
    keywords: ['map', 'maps', 'weather map', 'rainfall map', 'rain map', 'temperature map', 'wind map', 'satellite', 'radar', 'gis', 'मानचित्र', 'नकाशे', 'पाऊस'],
  },
  {
    id: 'nav-alerts',
    tabId: 'alerts',
    icon: AlertTriangle,
    category: 'core',
    titles: {
      en: 'Alerts & Warnings',
      hi: 'चेतावनियाँ और अलर्ट',
      mr: 'इशारे आणि सूचना',
    },
    subtitles: {
      en: 'Official IMD color-coded warnings (Red, Orange, Yellow)',
      hi: 'आधिकारिक IMD रंग-कोडित चेतावनियाँ (लाल, नारंगी, पीली)',
      mr: 'अधिकृत IMD रंग-कोडेड इशारे (लाल, केशरी, पिवळा)',
    },
    keywords: ['alert', 'alerts', 'warning', 'warnings', 'danger', 'weather warning', 'imd warning', 'red alert', 'orange alert', 'emergency', 'चेतावनियाँ', 'इशारे', 'रेड अलर्ट'],
  },
  {
    id: 'nav-climate',
    tabId: 'climate',
    icon: History,
    category: 'core',
    titles: {
      en: 'Climate & Historical',
      hi: 'जलवायु और ऐतिहासिक',
      mr: 'हवामान आणि ऐतिहासिक माहिती',
    },
    subtitles: {
      en: '10-year historical trends, climate warming analysis & projections',
      hi: '10-वर्षीय ऐतिहासिक रुझान, जलवायु परिवर्तन विश्लेषण और अनुमान',
      mr: '१०-वार्षिक ऐतिहासिक कल, हवामान बदल विश्लेषण व अंदाज',
    },
    keywords: ['climate', 'historical', 'history', 'past weather', 'climate history', 'temperature trend', 'rainfall trend', 'anomaly', 'decadal', 'जलवायु', 'ऐतिहासिक'],
  },
  {
    id: 'nav-sectoral',
    tabId: 'sectoral',
    icon: Briefcase,
    category: 'core',
    titles: {
      en: 'Sectoral Advisory',
      hi: 'क्षेत्रीय सलाह',
      mr: 'क्षेत्रीय सल्ला',
    },
    subtitles: {
      en: '8 industry-specific decision intelligence advisories',
      hi: '8 उद्योग-विशिष्ट निर्णय और परिचालन सलाह बुलेटिन',
      mr: '८ उद्योग-विशिष्ट निर्णय व परिचालन सल्ला बुलेटिन',
    },
    keywords: ['advisory', 'sector', 'sectoral', 'operational advisory', 'decision', 'उद्योग', 'सलाह', 'सल्ला'],
  },

  // Sectoral Verticals
  {
    id: 'sector-agri',
    tabId: 'sectoral',
    sectorId: 'agriculture',
    icon: Wheat,
    category: 'sector',
    titles: {
      en: 'Agriculture & Farming',
      hi: 'कृषि और खेती',
      mr: 'शेती व कृषी',
    },
    subtitles: {
      en: 'Crop risk, irrigation windows, pesticide spraying & harvest safety',
      hi: 'फसल जोखिम, सिंचाई समय, कीटनाशक छिड़काव व कटाई सुरक्षा',
      mr: 'पीक जोखीम, सिंचन नियोजन, कीटकनाशक फवारणी व कापणी सुरक्षा',
    },
    keywords: ['agriculture', 'farming', 'farmer', 'crops', 'crop', 'irrigation', 'spraying', 'harvest', 'soil', 'kisan', 'agri', 'कृषि', 'खेती', 'किसान', 'शेती', 'पीक', 'सिंचन'],
  },
  {
    id: 'sector-aviation',
    tabId: 'sectoral',
    sectorId: 'aviation',
    icon: Plane,
    category: 'sector',
    titles: {
      en: 'Aviation & Aerodromes',
      hi: 'विमानन और हवाई अड्डा',
      mr: 'विमान वाहतूक व विमानतळ',
    },
    subtitles: {
      en: 'Runway visibility, crosswind shear, icing & flight hazard ratings',
      hi: 'रनवे दृश्यता, क्रॉसविंड शीयर, आइसिंग व उड़ान जोखिम रेटिंग',
      mr: 'धावपट्टी दृश्यमानता, क्रॉसविंड, आइसिंग व उड्डाण जोखीम मानांकन',
    },
    keywords: ['aviation', 'flight', 'airport', 'flying', 'pilot', 'crosswind', 'turbulence', 'runway', 'air', 'विमानन', 'उड़ान', 'विमान वाहतूक', 'विमानतळ'],
  },
  {
    id: 'sector-marine',
    tabId: 'sectoral',
    sectorId: 'marine',
    icon: Anchor,
    category: 'sector',
    titles: {
      en: 'Marine & Fisheries',
      hi: 'समुद्री व मत्स्य पालन',
      mr: 'सागरी व मत्स्य व्यवसाय',
    },
    subtitles: {
      en: 'Sea state, coastal swell, small craft warnings & fishermen advisories',
      hi: 'समुद्र की स्थिति, तटीय लहरें, नाव चेतावनी व मछुआरा सलाह',
      mr: 'समुद्राची स्थिती, लाटांचा जोर, नौका इशारा व मच्छीमार सल्ला',
    },
    keywords: ['marine', 'fisheries', 'fishing', 'sea', 'ocean', 'coastal', 'boat', 'fishermen', 'waves', 'swell', 'समुद्री', 'मत्स्य', 'सागरी', 'मासेमारी', 'मच्छीमार'],
  },
  {
    id: 'sector-disaster',
    tabId: 'sectoral',
    sectorId: 'disaster',
    icon: ShieldAlert,
    category: 'sector',
    titles: {
      en: 'Disaster Management',
      hi: 'आपदा प्रबंधन',
      mr: 'आपत्ती व्यवस्थापन',
    },
    subtitles: {
      en: 'Urban flood thresholds, cyclone readiness & evacuation protocols',
      hi: 'शहरी बाढ़ सीमा, चक्रवात तैयारी व निकासी प्रोटोकॉल',
      mr: 'पूर पातळी मर्यादा, चक्रीवादळ सज्जता व स्थलांतर कार्यपद्धती',
    },
    keywords: ['disaster', 'flood', 'emergency', 'cyclone', 'disaster management', 'ndrf', 'sdrf', 'evacuation', 'आपदा', 'आपत्ती', 'पूर', 'चक्रीवादळ', 'बचाव'],
  },
  {
    id: 'sector-health',
    tabId: 'sectoral',
    sectorId: 'health',
    icon: HeartPulse,
    category: 'sector',
    titles: {
      en: 'Public Health',
      hi: 'जन स्वास्थ्य',
      mr: 'सार्वजनिक आरोग्य',
    },
    subtitles: {
      en: 'Heat index stress, wet-bulb thresholds, hydration & UV protection',
      hi: 'हीट इंडेक्स तनाव, वेट-बल्ब सीमा, जलयोजन व यूवी संरक्षण',
      mr: 'उष्णता निर्देशांक ताण, वेट-बल्ब मर्यादा, हायड्रेशन व अतिनील किरण संरक्षण',
    },
    keywords: ['health', 'heat', 'heat stress', 'uv', 'health weather', 'dehydration', 'sunstroke', 'aqi', 'स्वास्थ्य', 'आरोग्य', 'उष्णता', 'उष्माघात'],
  },
  {
    id: 'sector-urban',
    tabId: 'sectoral',
    sectorId: 'urban',
    icon: Building2,
    category: 'sector',
    titles: {
      en: 'Urban Planning',
      hi: 'शहरी नियोजन',
      mr: 'नगर नियोजन',
    },
    subtitles: {
      en: 'Stormwater runoff, concrete heat island & municipal readiness',
      hi: 'तूफानी जल बहाव, कंक्रीट हीट आइलैंड व नगर निगम तैयारी',
      mr: 'पावसाचे पाण्याचा निचरा, हीट आयलंड व नागरी सज्जता',
    },
    keywords: ['urban', 'city', 'urban planning', 'drainage', 'heat island', 'stormwater', 'civic', 'construction', 'शहरी', 'नगर नियोजन', 'ड्रेनेज'],
  },
  {
    id: 'sector-transport',
    tabId: 'sectoral',
    sectorId: 'transport',
    icon: Truck,
    category: 'sector',
    titles: {
      en: 'Transport & Logistics',
      hi: 'परिवहन व लॉजिस्टिक्स',
      mr: 'वाहतूक आणि लॉजिस्टिक्स',
    },
    subtitles: {
      en: 'Highway fog hazard, hydroplaning, fleet routing & supply chain safety',
      hi: 'राजमार्ग कोहरा जोखिम, हाइड्रोप्लेनिंग, फ्लीट रूटिंग व आपूर्ति श्रृंखला',
      mr: 'महामार्ग धुके जोखीम, हायड्रोप्लेनिंग, वाहतूक नियोजन व पुरवठा साखळी',
    },
    keywords: ['transport', 'logistics', 'road', 'travel', 'traffic weather', 'visibility', 'highway', 'fog', 'trucking', 'supply chain', 'परिवहन', 'वाहतूक', 'महामार्ग'],
  },
  {
    id: 'sector-energy',
    tabId: 'sectoral',
    sectorId: 'energy',
    icon: Zap,
    category: 'sector',
    titles: {
      en: 'Energy & Power Grid',
      hi: 'ऊर्जा व पावर ग्रिड',
      mr: 'ऊर्जा व वीज ग्रिड',
    },
    subtitles: {
      en: 'Solar irradiance generation, wind turbine output & peak cooling demand',
      hi: 'सौर विकिरण उत्पादन, पवन टरबाइन क्षमता व पीक कूलिंग मांग',
      mr: 'सौर ऊर्जा उत्पादन, पवन ऊर्जा क्षमता व वीज मागणी',
    },
    keywords: ['energy', 'solar', 'power', 'electricity', 'wind energy', 'grid', 'demand peak', 'cooling load', 'solar irradiance', 'ऊर्जा', 'वीज', 'सौर'],
  },
];

/**
 * Searches destinations using query string and language locale
 */
export function searchDestinations(
  query: string,
  language: SupportedLanguage
): SearchDestination[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return SEARCH_DESTINATIONS.filter((dest) => {
    const title = (dest.titles[language] || dest.titles.en).toLowerCase();
    const subtitle = (dest.subtitles[language] || dest.subtitles.en).toLowerCase();

    // Check title match
    if (title.includes(q)) return true;

    // Check keyword match
    if (dest.keywords.some((kw) => kw.toLowerCase().includes(q))) return true;

    // Check subtitle match
    if (subtitle.includes(q)) return true;

    return false;
  }).sort((a, b) => {
    // Exact or startsWith match on title gets highest priority
    const titleA = (a.titles[language] || a.titles.en).toLowerCase();
    const titleB = (b.titles[language] || b.titles.en).toLowerCase();

    const aStarts = titleA.startsWith(q);
    const bStarts = titleB.startsWith(q);

    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return 0;
  });
}
