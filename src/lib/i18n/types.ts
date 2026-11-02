export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'mr'
  | 'gu'
  | 'ta'
  | 'te'
  | 'ml'
  | 'kn'
  | 'bn'
  | 'pa'
  | 'or'
  | 'as';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', label: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', label: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
];

export function getLanguageLocale(lang: SupportedLanguage): string {
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'mr':
      return 'mr-IN';
    case 'gu':
      return 'gu-IN';
    case 'ta':
      return 'ta-IN';
    case 'te':
      return 'te-IN';
    case 'ml':
      return 'ml-IN';
    case 'kn':
      return 'kn-IN';
    case 'bn':
      return 'bn-IN';
    case 'pa':
      return 'pa-IN';
    case 'or':
      return 'or-IN';
    case 'as':
      return 'as-IN';
    case 'en':
    default:
      return 'en-US';
  }
}

export interface TranslationDictionary {
  // Navigation & Core App
  nav: {
    dashboard: string;
    askWeatherGPT: string;
    forecast: string;
    maps: string;
    alerts: string;
    climate: string;
    sectoral: string;
    companionSubtitle: string;
    imd: string;
    moes: string;
    govIndia: string;
  };

  // Top Navigation & Global Search
  topNav: {
    searchPlaceholder: string;
    selectLocation: string;
    popularCities: string;
    searchCity: string;
    searching: string;
    quickAskPrefix: string;
    resultsGroupNav: string;
    resultsGroupSectors: string;
    noResults: string;
    pressEnterToAsk: string;
  };

  // Home / Welcome Banner
  home: {
    greeting: string;
    welcomeMessage: string;
  };

  // Dashboard specifics
  dashboard: {
    forecastTitle: string;
    severe: string;
    alertsCount: string;
    watchesCount: string;
    normalConditionDesc: string;
    imdBulletin: string;
    analyzeWithAi: string;
    fullChat: string;
    greetingPreview: string;
    introPreview: string;
    suggestedQuestions: string;
    askAnything: string;
    updatedAt: string;
    realtimeProvider: string;
  };

  // Weather Metrics & Labels
  weather: {
    temperature: string;
    feelsLike: string;
    humidity: string;
    wind: string;
    windSpeed: string;
    windDirection: string;
    windGusts: string;
    rainProbability: string;
    precipitation: string;
    pressure: string;
    visibility: string;
    uvIndex: string;
    airQuality: string;
    sunrise: string;
    sunset: string;
    dewPoint: string;
    hourlyForecast: string;
    dailyForecast: string;
    today: string;
    tomorrow: string;
    tonight: string;
    next24Hours: string;
    next7Days: string;
    radarLive: string;
    satellite: string;
    rainfallLayer: string;
    temperatureLayer: string;
    windLayer: string;
    now: string;
  };

  // Weather Conditions
  conditions: {
    clear: string;
    mostlyClear: string;
    partlyCloudy: string;
    overcast: string;
    fog: string;
    drizzle: string;
    rain: string;
    heavyRain: string;
    thunderstorm: string;
    snow: string;
  };

  // Weather Forecast view
  forecast: {
    summaryTitle: string;
    summarySubtitle: string;
    actual: string;
    humid: string;
    dry: string;
    comfortable: string;
    windGustsLabel: string;
    hourlyTitle: string;
    hourlySubtitle: string;
    hourlyScrollHint: string;
    dailyTitle: string;
    dailySubtitle: string;
    day: string;
    condition: string;
    minMax: string;
    rainChance: string;
    intelligenceTitle: string;
    highRain: string;
    lightRain: string;
    dryClear: string;
    tempPeak: string;
    breezy: string;
    gentleBreeze: string;
    highUv: string;
    modUv: string;
    refreshing: string;
    askForecast: string;
    poweredBy: string;
    temperatureTrend: string;
    thermalCurveHint: string;
    precipitationChart: string;
    chanceLabel: string;
    precipLabel: string;
    askQuestionBanner: string;
    askQuestionDesc: string;
  };

  // Weather Maps
  maps: {
    intelligence: string;
    pageTitle: string;
    pageSubtitle: string;
    refreshGrid: string;
    askRadar: string;
    heavyRainAreas: string;
    hotAreas: string;
    strongWindAreas: string;
    monitoredRegions: string;
    noneActive: string;
    noneExceeding: string;
    calmGrid: string;
    synopticCoverage: string;
    noticeTitle: string;
    noticeDesc: string;
    focusedLocation: string;
    clickMapPrompt: string;
    layerRainfall: string;
    layerTemperature: string;
    layerWind: string;
    layerSatellite: string;
  };

  // Alerts & Warnings
  alerts: {
    alertsTitle: string;
    activeAlerts: string;
    redAlert: string;
    orangeAlert: string;
    yellowAlert: string;
    greenAlert: string;
    immediateAction: string;
    bePrepared: string;
    beUpdated: string;
    noAlerts: string;
    officialImdNotice: string;
    dismiss: string;
    viewDetails: string;
    affectedAreas: string;
    validUntil: string;
    bureauTitle: string;
    bureauSubtitle: string;
    preferences: string;
    refreshWarnings: string;
    severeWarnings: string;
    weatherAlerts: string;
    weatherWatches: string;
    normalStations: string;
    allAlerts: string;
    severeOnly: string;
    rainFilter: string;
    thunderstormFilter: string;
    lightningFilter: string;
    heatFilter: string;
    coldFilter: string;
    windFilter: string;
    floodFilter: string;
    normalAtmosphereMsg: string;
  };

  // Climate & Historical
  climate: {
    title: string;
    subtitle: string;
    tabTrends: string;
    tabAnomaly: string;
    tabExtremes: string;
    tabMonsoon: string;
    tabCompare: string;
    tabFuture: string;
    exportCsv: string;
    varAvgTemp: string;
    varMaxTemp: string;
    varMinTemp: string;
    varPrecip: string;
    varRainyDays: string;
    varHotDays: string;
    varWind: string;
    yearly: string;
    monthly: string;
    timeRange: string;
  };

  // Sectoral Advisory
  sectoral: {
    title: string;
    subtitle: string;
    domainsTitle: string;
    chooseSector: string;
    chooseSectorDesc: string;
    agriculture: string;
    aviation: string;
    marine: string;
    disaster: string;
    health: string;
    urban: string;
    transport: string;
    energy: string;
    favorable: string;
    caution: string;
    critical: string;
    recommendations: string;
    riskMatrix: string;
    hourlyTimeline: string;
    exportBulletin: string;
    share: string;
    primaryDirective: string;
    riskScore: string;
    whyAction: string;
    weatherFactors: string;
  };

  // Chatbot (Ask WeatherGPT)
  chat: {
    title: string;
    placeholder: string;
    send: string;
    clearChat: string;
    suggestedHeading: string;
    qRain24h: string;
    qTempToday: string;
    qTomorrow: string;
    qUmbrella: string;
    qWind: string;
    qTonight: string;
    stageChecking: string;
    stageAnalyzing: string;
    newChat: string;
    history: string;
    searchHistory: string;
    noHistory: string;
    deleteChat: string;
    confirmDeleteTitle: string;
    voiceMode: string;
    listening: string;
    thinking: string;
    speaking: string;
    connecting: string;
    stopVoice: string;
    todayGroup: string;
    yesterdayGroup: string;
    previous7DaysGroup: string;
    olderGroup: string;
  };

  // Notification center
  notifications: {
    newBadge: string;
    markAllRead: string;
    source: string;
    openDashboard: string;
    officialAlert: string;
  };

  // Common UI
  common: {
    loading: string;
    refresh: string;
    error: string;
    retry: string;
    close: string;
    viewMore: string;
    back: string;
    language: string;
  };

  // Auth & Roles
  auth?: {
    signIn: string;
    signUp: string;
    userLogin: string;
    adminLogin: string;
    emailAddress: string;
    password: string;
    confirmPassword: string;
    rememberMe: string;
    forgotPassword: string;
    continueWithGoogle: string;
    dontHaveAccount: string;
    createOne: string;
    alreadyHaveAccount: string;
    backToSignIn: string;
    safeAndSecure: string;
    safeAndSecureDesc: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    welcomeDescription: string;
    heroTitle: string;
    heroTitleHighlight: string;
    heroSubtitle: string;
    heroQuote: string;
    realtimeWeather: string;
    forecast7Day: string;
    interactiveMaps: string;
    alertsWarnings: string;
    climateInsights: string;
    sectoralAdvisory: string;
    signingIn: string;
    creatingAccount: string;
    adminAccessDenied: string;
    invalidCredentials: string;
    resetPasswordTitle: string;
    resetPasswordDescription: string;
    sendResetLink: string;
    resetEmailSent: string;
    signUpSuccess: string;
    logout: string;
    role: string;
    user: string;
    admin: string;
    adminBadge: string;
    userBadge: string;
  };
}

