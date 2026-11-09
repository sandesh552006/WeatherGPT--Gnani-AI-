import { WeatherData, GeoLocation, ChatApiResponse, WeatherSummaryCardData } from './types';
import { getVoiceConfigForLanguage } from './voice/config';
import { findIndianLocation } from './i18n/locations';

// Common inflected forms of Indian cities in Marathi / Hindi (e.g. पुण्यात -> पुणे)
export const MARATHI_CITY_INFLECTIONS: Record<string, string> = {
  पुण्यात: 'पुणे',
  पुण्यामध्ये: 'पुणे',
  पुण्याचा: 'पुणे',
  पुण्याची: 'पुणे',
  पुण्याचे: 'पुणे',
  मुंबईत: 'मुंबई',
  मुंबईमध्ये: 'मुंबई',
  मुंबईचा: 'मुंबई',
  मुंबईची: 'मुंबई',
  मुंबईचे: 'मुंबई',
  दिल्लीत: 'दिल्ली',
  दिल्लीमध्ये: 'दिल्ली',
  नागपुरात: 'नागपूर',
  नागपूरमध्ये: 'नागपूर',
  नाशिकात: 'नाशिक',
  नाशिकमध्ये: 'नाशिक',
  कोल्हापुरात: 'कोल्हापूर',
  कोल्हापूरमध्ये: 'कोल्हापूर',
  साताऱ्यात: 'सातारा',
  सांगलीत: 'सांगली',
  सोलापुरात: 'सोलापूर',
  जयपुरात: 'जयपुर',
  जयपूरमध्ये: 'जयपुर',
  जयपुरमध्ये: 'जयपुर',
  कोलकात्यात: 'कोलकाता',
  चेन्नईत: 'चेन्नई',
  सुरतेत: 'सुरत',
  सुरतमध्ये: 'सुरत',
  अमरावतीत: 'अमरावती',
  ठाण्यात: 'ठाणे',
  बंगळुरात: 'बंगळूर',
  बंगळुरूमध्ये: 'बंगळूर',
};

// Common banned words / temporal terms / weather concepts / pronouns that are NOT location names
export const LOCATION_BANNED_WORDS = new Set([
  // English greetings & casual phrases
  'hello',
  'hi',
  'hey',
  'greetings',
  'namaste',
  'tell',
  'me',
  'please',
  'thanks',
  'thank',
  'how',
  'who',
  'what',
  'why',
  'when',
  'which',
  'where',
  'do',
  'does',
  'did',
  'is',
  'are',
  'was',
  'were',
  'can',
  'could',
  'will',
  'would',
  'should',
  'you',
  'your',
  'about',
  'weathergpt',
  'bot',
  'assistant',
  'ai',
  'farmer',
  'farmers',
  'farming',
  'precaution',
  'precautions',
  'wear',
  'clothes',
  'clothing',
  'advice',
  'good',
  'morning',
  'afternoon',
  'evening',
  'night',
  'day',
  'time',
  'city',
  'cities',
  'place',
  'places',
  'and',
  'or',
  'versus',
  'vs',
  'than',
  'from',
  'to',
  'between',
  // English temporal & weather
  'tomorrow',
  'today',
  'tonight',
  'yesterday',
  'now',
  'the rain',
  'the wind',
  'rain',
  'wind',
  'temperature',
  'temp',
  'humidity',
  'forecast',
  'weather',
  'this',
  'it',
  'there',
  'here',
  'my city',
  'outdoor activities',
  'an umbrella',
  'umbrella',
  'a run',
  'a walk',
  'work',
  'the next',
  'weekend',
  'sunny',
  'cloudy',
  'hot',
  'cold',
  'climate',
  'condition',
  'better',
  'worse',
  'hotter',
  'colder',
  'warmer',
  'difference',
  // Hindi temporal, weather & stop words
  'नमस्ते',
  'नमस्कार',
  'प्रणाम',
  'हाय',
  'हेलो',
  'कैसे',
  'कैसा',
  'कैसी',
  'क्या',
  'कौन',
  'कहाँ',
  'कहा',
  'कहो',
  'बताओ',
  'बताइए',
  'बोलिए',
  'धन्यवाद',
  'शुक्रिया',
  'कल',
  'आज',
  'रात',
  'सुबह',
  'शाम',
  'अभी',
  'बारिश',
  'मौसम',
  'तापमान',
  'हवा',
  'गर्मी',
  'ठंड',
  'आर्द्रता',
  'वर्षा',
  'छाता',
  'बादल',
  'धूप',
  'वहाँ',
  'वहा',
  'वहां',
  'यहाँ',
  'यहा',
  'यहां',
  'उधर',
  'इधर',
  'होगी',
  'होगा',
  'ज्यादा',
  'कम',
  'तुलना',
  'दोनों',
  // Marathi temporal, weather & stop words
  'नमस्कार',
  'हाय',
  'हॅलो',
  'कसे',
  'कसा',
  'कशी',
  'काय',
  'कोण',
  'कुठे',
  'कधी',
  'सांगा',
  'बोला',
  'धन्यवाद',
  'आभार',
  'उद्या',
  'आज',
  'रात्री',
  'सकाळी',
  'संध्याकाळी',
  'आता',
  'पाऊस',
  'हवामान',
  'तापमान',
  'वारा',
  'थंडी',
  'उष्णता',
  'आर्द्रता',
  'छत्री',
  'ढग',
  'ऊन',
  'तिथे',
  'तिकडे',
  'इथे',
  'इकडे',
  'तेथे',
  'पडेल',
  'होईल',
  'असेल',
  'आहे',
  'जास्त',
  'कमी',
  'तुलना',
  'दोन्ही',
]);

/**
 * Checks whether a message is purely a greeting or pleasantry without weather queries
 */
export function isPureGreetingOrCasual(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  const stripped = message
    .trim()
    .toLowerCase()
    .replace(/\bweathergpt\b/g, '')
    .replace(/[?!.,।]+/g, '')
    .trim();
  if (!stripped) return true;

  // If user explicitly asks about weather or rain or temperature, it's not a pure greeting
  if (
    stripped.includes('weather') ||
    stripped.includes('rain') ||
    stripped.includes('temp') ||
    stripped.includes('forecast') ||
    stripped.includes('हवामान') ||
    stripped.includes('मौसम') ||
    stripped.includes('पाऊस') ||
    stripped.includes('बारिश')
  ) {
    return false;
  }

  const greetings = [
    'hi',
    'hello',
    'hey',
    'hello there',
    'hi there',
    'hey there',
    'good morning',
    'good afternoon',
    'good evening',
    'good day',
    'how are you',
    'how are you doing',
    'how is it going',
    'whats up',
    'what is up',
    'who are you',
    'what are you',
    'thank you',
    'thanks',
    'thanks a lot',
    'namaste',
    'नमस्ते',
    'नमस्कार',
    'प्रणाम',
    'हाय',
    'हॅलो',
    'काय चाललंय',
    'कसे आहात',
  ];

  return greetings.some(
    (g) => stripped === g || stripped.startsWith(g + ' ') || stripped.endsWith(' ' + g) || stripped.includes(g)
  );
}

// Explicit reference pronouns that mean "refer to existing context"
export const CONTEXT_REFERENCE_PRONOUNS = new Set([
  'there',
  'here',
  'that city',
  'same place',
  'over there',
  'the city',
  'वहाँ',
  'वहा',
  'वहां',
  'यहाँ',
  'यहा',
  'यहां',
  'उधर',
  'इधर',
  'उसी जगह',
  'तिथे',
  'तिकडे',
  'इथे',
  'इकडे',
  'तेथे',
  'त्याच ठिकाणी',
]);

/**
 * Scans previous conversation turns in reverse order to identify the last active location discussed.
 */
export function getLastLocationFromHistory(
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): string | null {
  if (!Array.isArray(history) || history.length === 0) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    if (!turn?.content) continue;

    if (turn.role === 'user') {
      const extracted = extractLocationQuery(turn.content);
      if (extracted) return extracted;
    } else if (turn.role === 'assistant') {
      // Check for markdown bold city names e.g. **Mumbai** or **New Delhi** or **पुणे**
      const boldRegex = /\*\*([A-Za-z\u0900-\u097F\s,]{2,30}?)\*\*/g;
      let boldMatch: RegExpExecArray | null;
      while ((boldMatch = boldRegex.exec(turn.content)) !== null) {
        const candidate = boldMatch[1].trim();
        const candClean = candidate.split(/[,।]/)[0].trim();
        if (
          !LOCATION_BANNED_WORDS.has(candClean.toLowerCase()) &&
          candClean.length >= 2
        ) {
          const match = findIndianLocation(candClean);
          if (match) return match.name.en;
        }
      }
    }
  }

  return null;
}

/**
 * Normalizes a raw candidate location string by stripping Marathi/Hindi inflections.
 */
function normalizeCityCandidate(raw: string): string {
  const trimmed = raw.trim();
  if (MARATHI_CITY_INFLECTIONS[trimmed]) {
    return MARATHI_CITY_INFLECTIONS[trimmed];
  }
  if (trimmed.endsWith('मध्ये') && trimmed.length > 5) {
    return trimmed.replace(/मध्ये$/, '');
  }
  if (trimmed.endsWith('ात') && trimmed.length > 3) {
    return trimmed.replace(/ात$/, '');
  }
  return trimmed;
}

/**
 * Extracts a target city or location query from a user message in English, Hindi, or Marathi.
 * Returns null if the user is asking a follow-up about the existing city (or using reference pronouns like 'there', 'तिथे', 'वहाँ').
 */
export function extractLocationQuery(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): string | null {
  if (!message || typeof message !== 'string') return null;
  const raw = message.trim();
  if (!raw) return null;

  // Never treat pure greetings or pleasantries as location names (e.g. "Hello")
  if (isPureGreetingOrCasual(raw)) {
    return null;
  }

  const text = raw.replace(/[?!,।.]+$/g, '').trim();

  // 1. Pattern: English 'what/how about <City>'
  const aboutMatch = text.match(/^(?:what|how)\s+about\s+([A-Za-z\u0900-\u097F\s]{2,40})/i);
  if (aboutMatch) {
    const candidate = normalizeCityCandidate(aboutMatch[1].trim());
    if (!LOCATION_BANNED_WORDS.has(candidate.toLowerCase()) && candidate.length >= 2) {
      return candidate;
    }
  }

  // 2. Pattern: Hindi/Marathi city switch e.g. 'और जयपुर में?', 'आणि पुण्यात?', 'And Delhi?'
  const switchMatch = text.match(
    /^(?:और|आणि|and)\s+([A-Za-z\u0900-\u097F\s]{2,40}?)(?:\s+(?:में|का|की|के|मध्ये|चा|ची|चे|येथे|बद्दल))?$/i
  );
  if (switchMatch) {
    const resolved = normalizeCityCandidate(switchMatch[1].trim());
    const candLower = resolved.toLowerCase();
    if (!LOCATION_BANNED_WORDS.has(candLower) && resolved.length >= 2) {
      return resolved;
    }
  }

  // 3. Pattern: Postposition in Hindi / Marathi / English
  // e.g. 'मुंबई में', 'दिल्ली का', 'पुण्यात', 'जयपूरमध्ये'
  const postpositionMatch = text.match(
    /(?:^|[\s,।?!])([A-Za-z\u0900-\u097F]{2,30}?)\s+(?:में|का|की|के|मध्ये|येथे|त|चा|ची|चे)(?:[\s,।?!]|$)/i
  );
  if (postpositionMatch) {
    const resolved = normalizeCityCandidate(postpositionMatch[1].trim());
    const candLower = resolved.toLowerCase();
    if (!LOCATION_BANNED_WORDS.has(candLower) && resolved.length >= 2) {
      return resolved;
    }
  }

  // 4. Pattern: English 'weather/forecast/temp/rain in/at/for <City>'
  const inMatch = text.match(
    /\b(?:weather|forecast|temperature|temp|rain|climate)\s+(?:in|at|near|around|for)\s+([A-Za-z\u0900-\u097F\s,]{2,40}?)(?:\s+(?:today|tomorrow|tonight|now)|$|[?!,।])/i
  );
  if (inMatch) {
    const cand = normalizeCityCandidate(inMatch[1].trim());
    if (!LOCATION_BANNED_WORDS.has(cand.toLowerCase()) && cand.length >= 2) {
      return cand;
    }
  }

  // 5. Pattern: English 'in/at/near <City>'
  const simpleInMatch = text.match(
    /\b(?:in|at|near|around|for)\s+([A-Za-z\u0900-\u097F\s]{1,30}?)(?:\s+(?:today|tomorrow|tonight|now)|$|[?!,])/i
  );
  if (simpleInMatch) {
    const cand = normalizeCityCandidate(simpleInMatch[1].trim());
    if (!LOCATION_BANNED_WORDS.has(cand.toLowerCase()) && cand.length >= 2) {
      return cand;
    }
  }

  // 6. Pattern: Suffix query e.g. 'Mumbai weather', 'मुंबई हवामान', 'दिल्ली मौसम'
  const suffixMatch = text.match(
    /^([A-Za-z\u0900-\u097F\s]{2,30}?)\s+(?:weather|forecast|हवामान|मौसम)/i
  );
  if (suffixMatch) {
    const cand = normalizeCityCandidate(suffixMatch[1].trim());
    if (!LOCATION_BANNED_WORDS.has(cand.toLowerCase()) && cand.length >= 2) {
      return cand;
    }
  }

  // 7. Token scan for known Indian cities or inflected forms
  const tokens = text.split(/[\s,।?!]+/);
  for (const t of tokens) {
    const trimmed = t.trim();
    if (!trimmed || trimmed.length < 2) continue;
    if (LOCATION_BANNED_WORDS.has(trimmed.toLowerCase())) continue;
    if (CONTEXT_REFERENCE_PRONOUNS.has(trimmed.toLowerCase())) continue;

    const resolved = normalizeCityCandidate(trimmed);
    if (resolved && !LOCATION_BANNED_WORDS.has(resolved.toLowerCase())) {
      const match = findIndianLocation(resolved);
      if (match) return match.name.en;
      if (resolved !== trimmed) return resolved;
    }

    const directMatch = findIndianLocation(trimmed);
    if (directMatch) {
      return directMatch.name.en;
    }
  }

  return null;
}

/**
 * Detects if the user is comparing two cities (e.g. "Which is hotter: Pune or Mumbai?", "Compare Delhi and Bangalore").
 */
export function extractComparisonLocations(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): { isComparison: boolean; primaryCity: string | null; secondaryCity: string | null } {
  if (!message || typeof message !== 'string') {
    return { isComparison: false, primaryCity: null, secondaryCity: null };
  }

  const text = message.trim();
  const lower = text.toLowerCase();

  // Strict word-boundary check for real comparison intent
  const isComparisonQuery =
    /\b(compare|comparison|versus|vs|hotter|colder|warmer|cooler|better weather|difference between|which city|which place)\b/i.test(lower) ||
    /(तुलना|कुठे जास्त|कुठे कमी|कहाँ ज्यादा|कहाँ कम|दोन्ही शहर|दोनों शहर)/.test(text);

  if (!isComparisonQuery) {
    return { isComparison: false, primaryCity: null, secondaryCity: null };
  }

  // Look for two distinct cities mentioned directly in the message
  const words = text.split(/[\s,।?!;:]+/);
  const foundCities: string[] = [];

  for (const w of words) {
    const clean = normalizeCityCandidate(w);
    if (clean.length < 3 || LOCATION_BANNED_WORDS.has(clean.toLowerCase())) continue;

    const match = findIndianLocation(clean);
    if (match && !foundCities.includes(match.name.en)) {
      foundCities.push(match.name.en);
    }
  }

  if (foundCities.length >= 2) {
    return {
      isComparison: true,
      primaryCity: foundCities[0],
      secondaryCity: foundCities[1],
    };
  }

  // If one city is in the message and another was discussed in recent history during a comparison query
  if (foundCities.length === 1 && isComparisonQuery) {
    const priorCity = getLastLocationFromHistory(history);
    if (priorCity && priorCity.toLowerCase() !== foundCities[0].toLowerCase()) {
      return {
        isComparison: true,
        primaryCity: foundCities[0],
        secondaryCity: priorCity,
      };
    }
  }

  return { isComparison: false, primaryCity: foundCities[0] || null, secondaryCity: null };
}

/**
 * Bulletproof JSON parser for Gemini responses.
 * Gracefully handles markdown wrappers, unescaped newlines/tabs inside string literals,
 * and recovers valid JSON even when control characters are present.
 */
export function safeParseGeminiJson(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return null;

  const trimmed = rawText.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Strip markdown code fences
  let cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  // 3. Extract the outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      cleaned = candidate;
    }
  }

  // 4. Sanitize unescaped control characters inside JSON string literals
  // (Prevents "Bad control character in string literal in JSON" error permanently)
  try {
    let inString = false;
    let escaped = false;
    let result = '';

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const code = char.charCodeAt(0);

      if (char === '"' && !escaped) {
        inString = !inString;
        result += char;
      } else if (char === '\\' && inString) {
        escaped = !escaped;
        result += char;
      } else {
        if (inString) {
          if (char === '\n') {
            result += '\\n';
          } else if (char === '\r') {
            result += '\\r';
          } else if (char === '\t') {
            result += '\\t';
          } else if (code < 32) {
            result += '\\u' + code.toString(16).padStart(4, '0');
          } else {
            result += char;
          }
        } else {
          result += char;
        }
        escaped = false;
      }
    }

    return JSON.parse(result);
  } catch {}

  // 5. If JSON was truncated or malformed, extract reply string via regex
  try {
    const match = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (match && match[1]) {
      const unescaped = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
      return {
        reply: unescaped.trim(),
        followUps: [],
        showSummaryCard: true,
      };
    }
  } catch {}

  return null;
}

// Format the next 24 hours data into a concise summary text for Gemini
export function formatHourlyDataForPrompt(weather: WeatherData, label: string = 'TARGET LOCATION'): string {
  const current = weather.current;
  const analysis = weather.analysis24h;
  const hourly = weather.hourly24h || [];

  const hourlyLines = hourly
    .slice(0, 14)
    .map(
      (h) =>
        `- ${h.hourLabel}: ${h.temperature}°C, ${h.conditionText}, Rain Prob: ${h.precipitationProbability}%, Rain: ${h.rain}mm, Wind: ${h.windSpeed}km/h`
    )
    .join('\n');

  return `
--- ${label} OBSERVATIONS: ${weather.location.name}, ${weather.location.country} ---
- Current Temperature: ${current.temperature}°C (Feels like: ${current.feelsLike}°C)
- Current Condition: ${current.conditionText} (${current.conditionIcon})
- Humidity: ${current.humidity}%
- Wind: ${current.windSpeed} km/h (Gusts: ${current.windGusts} km/h, Direction: ${current.windDirection}°)
- Precipitation: ${current.precipitation} mm, Rain: ${current.rain} mm
- Pressure: ${current.pressure} hPa, Visibility: ${current.visibility} km

NEXT 24 HOURS METRICS:
- Will Rain: ${analysis.willRain ? 'YES' : 'NO'}
- Peak Rain Chance: ${analysis.peakRainProbability}% (Timing: ${analysis.peakRainWindow})
- Total Expected Rain: ${analysis.totalExpectedRainMm} mm
- Temperature Range: ${analysis.tempMin24h}°C (Coldest at ${analysis.coldestHour}) to ${analysis.tempMax24h}°C (Hottest at ${analysis.hottestHour})
- Max Wind Speed: ${analysis.maxWindSpeedKmH} km/h

HOURLY TIMELINE (Next 14 Hours):
${hourlyLines}
`;
}

/**
 * Intelligent, truthful fallback synthesizer used when Gemini is temporarily unavailable.
 * Generates natural, dynamic responses based on question intent without robotic dashboard dumps.
 */
export function synthesizeGroundedWeatherResponse(
  userMessage: string,
  weather: WeatherData,
  language: string = 'en',
  secondaryWeather?: WeatherData | null
): { reply: string; followUps: string[]; showSummaryCard: boolean } {
  const q = userMessage.toLowerCase().trim();
  const name = weather.location.name;
  const current = weather.current;
  const analysis = weather.analysis24h;

  // Comparison query handling in fallback
  if (secondaryWeather) {
    const secName = secondaryWeather.location.name;
    const secCurrent = secondaryWeather.current;

    const diff = Math.round(Math.abs(current.temperature - secCurrent.temperature));
    const warmerCity = current.temperature >= secCurrent.temperature ? name : secName;
    const warmerTemp = Math.max(current.temperature, secCurrent.temperature);
    const coolerCity = current.temperature < secCurrent.temperature ? name : secName;
    const coolerTemp = Math.min(current.temperature, secCurrent.temperature);

    if (language === 'mr') {
      return {
        reply: `**${warmerCity}** हे सध्या **${coolerCity}** पेक्षा जास्त उष्ण आहे! 🌡️\n\nसध्याची आकडेवारी पाहता, **${warmerCity}** येथे तापमान **${warmerTemp}°C** आहे, तर **${coolerCity}** येथे **${coolerTemp}°C** नोंदवले गेले आहे (फरक: ~${diff}°C).\n\n• **${name}**: ${current.temperature}°C, ${current.conditionText}, आर्द्रता: ${current.humidity}%\n• **${secName}**: ${secCurrent.temperature}°C, ${secCurrent.conditionText}, आर्द्रता: ${secCurrent.humidity}%`,
        followUps: [`${name} मध्ये आज पाऊस पडेल का?`, `${secName} मध्ये उद्या हवामान कसे असेल?`, `दोन्ही शहरांत वाऱ्याचा वेग किती आहे?`],
        showSummaryCard: true,
      };
    } else if (language === 'hi') {
      return {
        reply: `**${warmerCity}** वर्तमान में **${coolerCity}** की तुलना में अधिक गर्म है! 🌡️\n\nअभी **${warmerCity}** में तापमान **${warmerTemp}°C** है, जबकि **${coolerCity}** में **${coolerTemp}°C** दर्ज किया गया है (~${diff}°C का अंतर)।\n\n• **${name}**: ${current.temperature}°C, ${current.conditionText}, आर्द्रता: ${current.humidity}%\n• **${secName}**: ${secCurrent.temperature}°C, ${secCurrent.conditionText}, आर्द्रता: ${secCurrent.humidity}%`,
        followUps: [`क्या ${name} में बारिश होगी?`, `${secName} में कल का मौसम कैसा रहेगा?`, `किस शहर में हवा तेज है?`],
        showSummaryCard: true,
      };
    } else {
      return {
        reply: `Comparing the two cities right now, **${warmerCity}** is warmer than **${coolerCity}**! 🌡️\n\nCurrently, **${warmerCity}** is at **${warmerTemp}°C**, while **${coolerCity}** is at **${coolerTemp}°C** (a difference of about ${diff}°C).\n\n• **${name}**: ${current.temperature}°C, ${current.conditionText}, Humidity: ${current.humidity}%\n• **${secName}**: ${secCurrent.temperature}°C, ${secCurrent.conditionText}, Humidity: ${secCurrent.humidity}%`,
        followUps: [`Will it rain in ${name}?`, `What's the forecast for ${secName}?`, `Which city has stronger winds?`],
        showSummaryCard: true,
      };
    }
  }

  // 1. Casual greetings & pleasantries
  const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|how are you|namaste|नमस्ते|नमस्कार)/i.test(q);
  if (isGreeting) {
    if (language === 'mr') {
      return {
        reply: `नमस्कार! 😊 मी तुमचा वेदरजीपीटी (WeatherGPT) हवामान सहाय्यक आहे. मी आज तुम्हाला कशी मदत करू शकतो? आपण कोणत्याही शहराच्या हवामानाबद्दल, पावसाच्या शक्यतेबद्दल किंवा प्रवासाच्या सल्ल्याबद्दल विचारू शकता!`,
        followUps: [`${name} मधील आजचे हवामान कसे आहे?`, `पुढील २४ तासांत पाऊस पडेल का?`, `आज बाहेर जाताना काय काळजी घ्यावी?`],
        showSummaryCard: false,
      };
    } else if (language === 'hi') {
      return {
        reply: `नमस्ते! 😊 मैं आपका वेदरजीपीटी (WeatherGPT) एआई साथी हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ? आप किसी भी शहर के मौसम, बारिश की संभावना या यात्रा सुझाव के बारे में पूछ सकते हैं!`,
        followUps: [`${name} में आज का मौसम कैसा है?`, `क्या अगले 24 घंटों में बारिश होगी?`, `आज का तापमान कितना रहेगा?`],
        showSummaryCard: false,
      };
    } else {
      return {
        reply: `Hey there! 😊 I'm WeatherGPT, your friendly AI weather companion. How can I help you today? Feel free to ask about current conditions in ${name}, rain forecasts, travel tips, or anything else on your mind!`,
        followUps: [`What's today's weather in ${name}?`, `Will it rain in the next 24 hours?`, `What should I wear today?`],
        showSummaryCard: false,
      };
    }
  }

  // 2. Non-weather / General Knowledge inquiries
  const isGeneralKnowledge =
    q.includes('artificial intelligence') ||
    q.includes('machine learning') ||
    q.includes('what is ai') ||
    q.includes('climate change') ||
    q.includes('who are you') ||
    q.includes('tell me a joke');

  if (isGeneralKnowledge) {
    if (language === 'mr') {
      return {
        reply: `मी WeatherGPT आहे — थेट हवामान माहिती आणि सहाय्यासाठी डिझाइन केलेला बुद्धिमान एआय साथी! 🤖\n\nसध्या मी थेट Open-Meteo उपग्रह डेटा आणि हवामान विश्लेषणाशी जोडलेला आहे. हवामान, पाऊस, तापमान किंवा शेती/प्रवास सल्ल्याबद्दल आपण मला हवे ते विचारू शकता!`,
        followUps: [`${name} मध्ये आजचे तापमान काय आहे?`, `उद्या पाऊस पडेल का?`, `हवामान बदलाचा शेतीवर काय परिणाम होतो?`],
        showSummaryCard: false,
      };
    } else if (language === 'hi') {
      return {
        reply: `मैं WeatherGPT हूँ — लाइव मौसम डेटा और पूर्वानुमान के लिए बनाया गया आपका एआई साथी! 🤖\n\nमैं इस समय रीयल-टाइम मौसम और जलवायु विश्लेषण में आपकी पूरी मदद कर सकता हूँ। आप किसी भी शहर के मौसम, बारिश, तापमान या यात्रा सावधानियों के बारे में पूछ सकते हैं!`,
        followUps: [`${name} में आज का मौसम कैसा है?`, `क्या कल बारिश होगी?`, `मौसम का पूर्वानुमान कैसे लगाया जाता है?`],
        showSummaryCard: false,
      };
    } else {
      return {
        reply: `I'm WeatherGPT — your intelligent AI weather companion! 🤖 While my primary superpowers are analyzing live meteorological data, rain predictions, and travel advice, I'm always happy to help. Let me know what you'd like to explore!`,
        followUps: [`What's the weather in ${name}?`, `Will it rain tomorrow?`, `How does humidity affect temperature?`],
        showSummaryCard: false,
      };
    }
  }

  // 3. Rain & Umbrella Queries
  if (q.includes('rain') || q.includes('पाऊस') || q.includes('बारिश') || q.includes('umbrella') || q.includes('छत्री') || q.includes('छाता')) {
    if (language === 'mr') {
      return {
        reply: analysis.willRain
          ? `होय, पुढील २४ तासांत **${name}** मध्ये पावसाची शक्यता दिसते आहे! 🌧️\n\nसर्वाधिक शक्यता **${analysis.peakRainWindow}** दरम्यान सुमारे **${analysis.peakRainProbability}%** असेल (अपेक्षित पाऊस: ~${analysis.totalExpectedRainMm} मिमी). जर आपण त्या वेळी बाहेर पडत असाल, तर सोबत छत्री ठेवणे नक्कीच फायद्याचे ठरेल!`
          : `चांगली बातमी! पुढील २४ तासांत **${name}** मध्ये पावसाची कोणतीही मोठी शक्यता नाही. 🌤️\n\nपावसाची कमाल शक्यता केवळ **${analysis.peakRainProbability}%** आहे, त्यामुळे आज बाहेर जाताना छत्रीची गरज भासणार नाही!`,
        followUps: [`आज रात्री तापमान किती असेल?`, `उद्याचे हवामान कसे राहील?`, `वाऱ्याचा वेग किती आहे?`],
        showSummaryCard: true,
      };
    } else if (language === 'hi') {
      return {
        reply: analysis.willRain
          ? `हाँ, अगले 24 घंटों में **${name}** में बारिश के आसार हैं! 🌧️\n\nबारिश की सबसे अधिक संभावना **${analysis.peakRainWindow}** के आसपास लगभग **${analysis.peakRainProbability}%** है। यदि आप उस समय बाहर जा रहे हैं, तो छाता साथ रखना सुरक्षित रहेगा!`
          : `अच्छी खबर है! अगले 24 घंटों में **${name}** में बारिश की कोई खास संभावना नहीं है। 🌤️\n\nबारिश की अधिकतम संभावना सिर्फ **${analysis.peakRainProbability}%** है, इसलिए आज आपको छाते की जरूरत नहीं पड़ेगी!`,
        followUps: [`आज रात का तापमान क्या रहेगा?`, `कल का मौसम कैसा रहेगा?`, `हवा कितनी तेज चल रही है?`],
        showSummaryCard: true,
      };
    } else {
      return {
        reply: analysis.willRain
          ? `Yes, looks like you might need an umbrella in **${name}**! 🌧️\n\nThere's a significant chance of rain peaking around **${analysis.peakRainWindow}** with an estimated probability of **${analysis.peakRainProbability}%** (~${analysis.totalExpectedRainMm} mm expected). Keep rain gear handy if you're stepping out!`
          : `Good news! You likely won't need an umbrella in **${name}** today. 🌤️\n\nThe peak chance of rain over the next 24 hours is only **${analysis.peakRainProbability}%**, and conditions will stay mostly clear and dry.`,
        followUps: [`What's the temperature tonight?`, `What is the forecast for tomorrow?`, `How strong is the wind today?`],
        showSummaryCard: true,
      };
    }
  }

  // 4. Temperature & Clothing Queries
  if (q.includes('temp') || q.includes('तापमान') || q.includes('hot') || q.includes('cold') || q.includes('wear') || q.includes('कपडे') || q.includes('कपड़े')) {
    const advice =
      current.temperature > 32
        ? 'It will be quite warm today — light cotton clothes and staying well-hydrated are recommended.'
        : current.temperature < 18
        ? 'It might feel chilly during the morning and evening — a light jacket or sweater would be ideal.'
        : 'The weather is very pleasant — comfortable casual wear will be perfect for any outdoor plans!';

    if (language === 'mr') {
      return {
        reply: `**${name}** मध्ये सध्याचे तापमान **${current.temperature}°C** (जाणवणारे: ${current.feelsLike}°C) आहे! 🌡️\n\nपुढील २४ तासांत तापमान **${analysis.tempMin24h}°C** (${analysis.coldestHour}) ते **${analysis.tempMax24h}°C** (${analysis.hottestHour}) दरम्यान राहील.\n\n💡 **सल्ला**: ${
          current.temperature > 32
            ? 'दुपारी ऊन वाढू शकते, त्यामुळे हलके सुती कपडे वापरा आणि पुरेसे पाणी प्या.'
            : current.temperature < 18
            ? 'सकाळी व रात्री गारवा जाणवेल, त्यामुळे हलके उबदार कपडे उपयोगी ठरतील.'
            : 'हवामान अतिशय आल्हाददायक आहे, मैदानी कामांसाठी दिवस उत्तम आहे!'
        }`,
        followUps: [`आज पाऊस पडेल का?`, `उद्याचे तापमान कसे असेल?`, `वाऱ्याचा वेग किती आहे?`],
        showSummaryCard: true,
      };
    } else if (language === 'hi') {
      return {
        reply: `**${name}** में वर्तमान तापमान **${current.temperature}°C** (आभासी: ${current.feelsLike}°C) है! 🌡️\n\nअगले 24 घंटों में तापमान **${analysis.tempMin24h}°C** (${analysis.coldestHour}) से **${analysis.tempMax24h}°C** (${analysis.hottestHour}) के बीच रहेगा।\n\n💡 **सुझाव**: ${
          current.temperature > 32
            ? 'दोपहर में धूप तेज रह सकती है, हल्के सूती कपड़े पहनें और पर्याप्त पानी पिएं।'
            : current.temperature < 18
            ? 'शाम और सुबह ठंडक महसूस होगी, हल्का स्वेटर या जैकेट साथ रखें।'
            : 'मौसम बहुत सुखद है, बाहर घूमने या काम करने के लिए दिन अनुकूल है!'
        }`,
        followUps: [`क्या बारिश की संभावना है?`, `कल का तापमान कैसा रहेगा?`, `हवा की गति कितनी है?`],
        showSummaryCard: true,
      };
    } else {
      return {
        reply: `In **${name}**, it is currently **${current.temperature}°C** (feels like ${current.feelsLike}°C) with ${current.conditionText.toLowerCase()} skies! 🌡️\n\nOver the next 24 hours, temperatures will range between a cool **${analysis.tempMin24h}°C** around ${analysis.coldestHour} and a daytime high of **${analysis.tempMax24h}°C** around ${analysis.hottestHour}.\n\n💡 **Recommendation**: ${advice}`,
        followUps: [`Will it rain in ${name}?`, `What's tomorrow's forecast?`, `How humid is it right now?`],
        showSummaryCard: true,
      };
    }
  }

  // 5. Tomorrow Forecast
  if (q.includes('tomorrow') || q.includes('उद्या') || q.includes('कल')) {
    const tomorrow = weather.daily[1] || weather.daily[0];
    if (language === 'mr') {
      return {
        reply: `उद्या **${name}** मध्ये हवामान **${tomorrow?.conditionText}** ${tomorrow?.conditionIcon} राहण्याचा अंदाज आहे! ☀️\n\nतापमान **${tomorrow?.tempMin}°C** ते **${tomorrow?.tempMax}°C** दरम्यान राहील, आणि पावसाची कमाल शक्यता सुमारे **${tomorrow?.precipitationProbabilityMax}%** आहे.`,
        followUps: [`आज रात्री हवामान कसे असेल?`, `उद्या छत्री सोबत ठेवावी लागेल का?`, `पुढील ७ दिवसांचा अंदाज काय आहे?`],
        showSummaryCard: true,
      };
    } else if (language === 'hi') {
      return {
        reply: `कल **${name}** में मौसम **${tomorrow?.conditionText}** ${tomorrow?.conditionIcon} रहने का अनुमान है! ☀️\n\nतापमान **${tomorrow?.tempMin}°C** से **${tomorrow?.tempMax}°C** के बीच रहेगा, और बारिश की अधिकतम संभावना लगभग **${tomorrow?.precipitationProbabilityMax}%** है।`,
        followUps: [`आज रात का मौसम कैसा रहेगा?`, `क्या कल छाता ले जाना पड़ेगा?`, `आने वाले 7 दिनों का पूर्वानुमान क्या है?`],
        showSummaryCard: true,
      };
    } else {
      return {
        reply: `Tomorrow in **${name}**, expect **${tomorrow?.conditionText}** ${tomorrow?.conditionIcon} conditions! ☀️\n\nTemperatures will fluctuate between **${tomorrow?.tempMin}°C** and **${tomorrow?.tempMax}°C**, with a peak rain probability of **${tomorrow?.precipitationProbabilityMax}%**.`,
        followUps: [`What's the weather tonight?`, `Will I need an umbrella tomorrow?`, `What about the 7-day forecast?`],
        showSummaryCard: true,
      };
    }
  }

  // 6. Default general weather response (warm, conversational, non-mechanical)
  if (language === 'mr') {
    return {
      reply: `**${name}** मध्ये आज छान वातावरण आहे! 😊\n\nसध्याचे तापमान **${current.temperature}°C** असून आकाश **${current.conditionText.toLowerCase()}** ${current.conditionIcon} आहे. आर्द्रता सुमारे **${current.humidity}%** आणि वाऱ्याचा वेग **${current.windSpeed} किमी/तास** आहे. पुढील २४ तासांत पावसाची शक्यता **${analysis.peakRainProbability}%** राहील.`,
      followUps: [`${name} मध्ये आज पाऊस पडेल का?`, `आज रात्री तापमान किती कमी होईल?`, `उद्याचे हवामान कसे असेल?`],
      showSummaryCard: true,
    };
  } else if (language === 'hi') {
    return {
      reply: `**${name}** में आज मौसम काफी सुखद बना हुआ है! 😊\n\nवर्तमान में तापमान **${current.temperature}°C** है और आसमान **${current.conditionText.toLowerCase()}** ${current.conditionIcon} है। आर्द्रता **${current.humidity}%** और हवा की गति **${current.windSpeed} किमी/घंटा** है। अगले 24 घंटों में बारिश की संभावना अधिकतम **${analysis.peakRainProbability}%** है।`,
      followUps: [`क्या ${name} में बारिश होगी?`, `आज रात का तापमान क्या रहेगा?`, `कल का मौसम कैसा रहेगा?`],
      showSummaryCard: true,
    };
  } else {
    return {
      reply: `**${name}** is looking lovely today! 😊\n\nIt's currently **${current.temperature}°C** with **${current.conditionText.toLowerCase()}** ${current.conditionIcon} skies. Humidity is sitting at a comfortable **${current.humidity}%**, and winds are light at **${current.windSpeed} km/h**. Over the next 24 hours, the highest chance of rain is just **${analysis.peakRainProbability}%**.`,
      followUps: [`Will it rain in ${name} today?`, `What should I wear today?`, `What's the forecast for tomorrow?`],
      showSummaryCard: true,
    };
  }
}

/**
 * Generates an intelligent, natural conversational response powered by Gemini API,
 * with multi-turn memory, resilient model fallback, and verified Open-Meteo weather grounding.
 */
export async function generateWeatherChatResponse({
  userMessage,
  history = [],
  weatherData,
  language = 'en',
  secondaryWeatherData,
}: {
  userMessage: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  weatherData: WeatherData;
  language?: string;
  secondaryWeatherData?: WeatherData | null;
}): Promise<ChatApiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  const cardData: WeatherSummaryCardData = {
    locationName: weatherData.location.name,
    country: weatherData.location.country,
    temperature: weatherData.current.temperature,
    feelsLike: weatherData.current.feelsLike,
    conditionText: weatherData.current.conditionText,
    conditionIcon: weatherData.current.conditionIcon,
    humidity: weatherData.current.humidity,
    windSpeed: weatherData.current.windSpeed,
    rainProbability: weatherData.analysis24h.peakRainProbability,
    pressure: weatherData.current.pressure,
    visibility: weatherData.current.visibility,
    updatedAt: weatherData.current.timestamp,
  };

  // If Gemini API Key is missing or default placeholder
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key_here') {
    const fallback = synthesizeGroundedWeatherResponse(userMessage, weatherData, language, secondaryWeatherData);
    return {
      reply: fallback.reply,
      summaryCard: fallback.showSummaryCard ? cardData : undefined,
      followUps: fallback.followUps,
      location: weatherData.location,
      isConfigError: true,
    };
  }

  // Format primary and optional secondary (comparison) weather context
  const primaryWeatherText = formatHourlyDataForPrompt(weatherData, 'PRIMARY LOCATION');
  const secondaryWeatherText = secondaryWeatherData
    ? formatHourlyDataForPrompt(secondaryWeatherData, 'COMPARISON LOCATION')
    : '';

  const voiceCfg = getVoiceConfigForLanguage(language);
  const langInstruction =
    language !== 'en'
      ? `\nCRITICAL LANGUAGE DIRECTIVE: The user has selected ${voiceCfg.name.toUpperCase()} (${voiceCfg.nativeName}). You MUST formulate your entire "reply" strictly in fluent, natural, polite ${voiceCfg.name} using its authentic native script (e.g. Devanagari for Hindi/Marathi). Do not reply in English. Keep all meteorological metrics, numbers, and proper nouns accurate. All 3 items in the "followUps" array MUST also be written strictly in natural ${voiceCfg.name} using native script.`
      : `\nLanguage: English. Formulate your response in clear, warm, engaging conversational English.`;

  const systemPrompt = `You are WeatherGPT, an intelligent, conversational AI assistant with deep weather expertise, built for the WeatherGPT application.
Your personality is friendly, warm, knowledgeable, and natural — just like ChatGPT or Gemini.
${langInstruction}

QUESTION INTENT & CONVERSATIONAL GUIDELINES:
1. CASUAL CONVERSATION & GREETINGS ("hi", "hello", "how are you", "who are you", "thanks", "good morning"):
   - Greet warmly and naturally as an AI companion.
   - DO NOT dump weather statistics or force weather data into the conversation unless the user asked.
   - Set "showSummaryCard": false.
   - Keep it engaging, friendly, and brief.

2. GENERAL KNOWLEDGE & NON-WEATHER QUESTIONS ("what is AI", "explain machine learning", "what is climate change", "tell me something interesting"):
   - Answer intelligently, concisely, and clearly using your general intelligence.
   - DO NOT force weather data or statistics into the answer.
   - Set "showSummaryCard": false.

3. WEATHER INQUIRIES & FORECASTS ("weather in Pune", "will it rain tomorrow", "how windy is it", "clothing advice", "farming precautions"):
   - Use the verified Open-Meteo weather data provided below as your ABSOLUTE SOURCE OF TRUTH.
   - Sound like a human: weave temperatures, sky conditions, and rain probabilities into pleasant, readable sentences instead of robotic dashboard lists.
   - NEVER invent or hallucinate temperatures, precipitation percentages, wind speeds, or conditions. Every number must match the data below.
   - Use emojis naturally (e.g. 😊, ☀️, 🌧️, ☔, 💨) without overusing them.
   - Provide practical, thoughtful tips (e.g. umbrella, clothing, outdoor plans).
   - Set "showSummaryCard": true if providing a weather update or overview of a city. Set false for quick single-fact follow-ups.

4. MULTI-CITY COMPARISONS & FOLLOW-UPS ("which city is hotter", "compare Pune and Mumbai", "what about tomorrow"):
   - Use the provided PRIMARY and COMPARISON weather data below to contrast the conditions accurately.
   - Remember previous turns from conversation history to answer follow-up questions seamlessly.

OUTPUT FORMAT:
You must strictly return a valid JSON object matching this schema:
{
  "reply": "string (markdown-formatted conversational answer)",
  "followUps": ["string (3 short, highly relevant follow-up questions for the user to click)"],
  "showSummaryCard": boolean (true for city weather reports, false for casual talk or non-weather queries)
}

REAL RETRIEVED WEATHER DATA:
${primaryWeatherText}
${secondaryWeatherText}
`;

  // Construct sanitized multi-turn message contents for Gemini
  // Gemini requires strict alternating turns (user -> model -> user -> model -> ... -> user)
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // Take up to last 10 messages from history
  const recentHistory = history.slice(-10);

  for (const h of recentHistory) {
    if (!h.content || typeof h.content !== 'string' || h.content.trim().length === 0) continue;

    // Clean out any previous system error notes or developer banners that might have been stored
    const cleanContent = h.content
      .replace(/\*\(Note: Gemini connection error:.*?\)\*/g, '')
      .replace(/⚠️ \*\*Developer Note:.*?\n\n/g, '')
      .trim();

    if (!cleanContent) continue;

    const role: 'user' | 'model' = h.role === 'assistant' ? 'model' : 'user';

    // If consecutive messages have the same role, combine them to satisfy Gemini API alternating requirement
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${cleanContent}`;
    } else {
      contents.push({
        role,
        parts: [{ text: cleanContent }],
      });
    }
  }

  // Ensure conversation starts with 'user'
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  // Append current user message
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${userMessage}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });
  }

  // Resilient model fallback chain
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                reply: { type: 'STRING', description: 'Natural conversational markdown response.' },
                followUps: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  description: '3 short contextual follow-up questions.',
                },
                showSummaryCard: {
                  type: 'BOOLEAN',
                  description: 'True for weather updates/overviews; false for casual chat or general knowledge.',
                },
              },
              required: ['reply'],
            },
          },
        }),
        signal: AbortSignal.timeout(18000), // 18 second timeout per attempt
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.warn(`Gemini API returned status ${res.status} with model ${model}:`, errorText.slice(0, 200));
        lastError = new Error(`Gemini ${model} HTTP ${res.status}`);
        continue;
      }

      const json = await res.json();
      const rawResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawResponse || typeof rawResponse !== 'string' || rawResponse.trim().length === 0) {
        console.warn(`Empty response candidate from Gemini model ${model}`);
        continue;
      }

      // Safe JSON parsing with fallback recovery
      const parsed = safeParseGeminiJson(rawResponse);

      if (parsed && typeof parsed.reply === 'string' && parsed.reply.trim().length > 0) {
        return {
          reply: parsed.reply.trim(),
          followUps: Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : undefined,
          summaryCard: parsed.showSummaryCard === true ? cardData : undefined,
          location: weatherData.location,
        };
      }

      // If response is raw conversational text rather than JSON, deliver the natural text cleanly!
      const directText = rawResponse
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      if (directText.length > 0) {
        return {
          reply: directText,
          followUps: [
            language === 'hi' ? 'कल का मौसम कैसा रहेगा?' : language === 'mr' ? 'उद्याचे हवामान कसे असेल?' : `What's the weather tomorrow in ${weatherData.location.name}?`,
            language === 'hi' ? 'क्या आज बारिश होगी?' : language === 'mr' ? 'आज पाऊस पडेल का?' : `Will it rain today in ${weatherData.location.name}?`,
            language === 'hi' ? 'आज का तापमान क्या है?' : language === 'mr' ? 'आजचे तापमान किती आहे?' : `What's the temperature in ${weatherData.location.name}?`,
          ],
          summaryCard: cardData,
          location: weatherData.location,
        };
      }
    } catch (err: any) {
      console.warn(`Attempt with model ${model} failed (${err?.name || 'Error'}):`, err?.message);
      lastError = err;
    }
  }

  // Graceful intelligent fallback if all Gemini API attempts failed
  // Log technical error securely on the server without exposing it to the user
  console.error('All Gemini model attempts exhausted:', lastError?.message || lastError);

  const fallback = synthesizeGroundedWeatherResponse(userMessage, weatherData, language, secondaryWeatherData);

  return {
    reply: fallback.reply,
    summaryCard: fallback.showSummaryCard ? cardData : undefined,
    followUps: fallback.followUps,
    location: weatherData.location,
  };
}
