import { NextRequest, NextResponse } from 'next/server';
import { GeoLocation } from '@/lib/types';
import { fetchWeatherData } from '@/lib/weather';
import { getVoiceConfigForLanguage, GEMINI_LIVE_MODELS } from '@/lib/voice/config';

export const dynamic = 'force-dynamic';

function formatHourlyContext(weather: any): string {
  const current = weather.current;
  const analysis = weather.analysis24h;
  const hourly = weather.hourly24h || [];

  const hourlyLines = hourly
    .slice(0, 12)
    .map(
      (h: any) =>
        `- ${h.hourLabel}: ${h.temperature}°C, ${h.conditionText}, Rain: ${h.precipitationProbability}%, Wind: ${h.windSpeed}km/h`
    )
    .join('\n');

  return `
CURRENT OBSERVATIONS (${weather.location.name}, ${weather.location.country}):
- Temperature: ${current.temperature}°C (Feels like: ${current.feelsLike}°C)
- Condition: ${current.conditionText} (${current.conditionIcon})
- Humidity: ${current.humidity}%
- Wind Speed: ${current.windSpeed} km/h (Gusts: ${current.windGusts} km/h)
- Precipitation: ${current.precipitation} mm
- Pressure: ${current.pressure} hPa

NEXT 24 HOURS METRICS:
- Rain Expected: ${analysis.willRain ? 'YES' : 'NO'}
- Peak Rain Chance: ${analysis.peakRainProbability}% (${analysis.peakRainWindow})
- Expected Rain Amount: ${analysis.totalExpectedRainMm} mm
- Temperature Range: ${analysis.tempMin24h}°C to ${analysis.tempMax24h}°C
- Coldest Hour: ${analysis.coldestHour} (${analysis.tempMin24h}°C)
- Hottest Hour: ${analysis.hottestHour} (${analysis.tempMax24h}°C)
- Max Wind Speed: ${analysis.maxWindSpeedKmH} km/h

HOURLY TIMELINE:
${hourlyLines}
`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key_here') {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY is not configured on the server. Please add your key to .env.local',
          isConfigError: true,
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { location, language = 'en' } = body;

    const targetLocation: GeoLocation = {
      name: location?.name || 'New Delhi',
      country: location?.country || 'India',
      latitude: location?.latitude || 28.6214,
      longitude: location?.longitude || 77.2148,
      timezone: location?.timezone || 'Asia/Kolkata',
    };

    // 1. Fetch real weather data from Open-Meteo for grounding
    const weatherData = await fetchWeatherData(targetLocation);
    const weatherText = formatHourlyContext(weatherData);

    const voiceConfig = getVoiceConfigForLanguage(language);

    // 2. Formulate grounded system instruction (kept server-side only)
    const systemInstruction = `You are WeatherGPT, an intelligent, friendly conversational weather assistant having a live voice conversation with the user.
Your role is to answer questions about the current weather, next 24 hours forecast, rain probability, temperature, wind, clothing, and outdoor activities.
${voiceConfig.instruction}

CRITICAL GROUNDING & TRUTHFULNESS DIRECTIVES:
1. The real-time weather observations below are the ABSOLUTE SOURCE OF TRUTH.
2. DO NOT INVENT or HALLUCINATE temperatures, rain percentages, timings, or wind speeds.
3. Every numeric value you state MUST match the retrieved data below.
4. Keep spoken responses concise, friendly, and conversational (usually 2 to 3 sentences).
5. If asked about clothing or rain, give practical advice (e.g. umbrella, light jacket).
6. Official meteorological warnings are authoritative; keep advice clear and calm.

GROUNDED REAL-TIME WEATHER DATA FOR ${targetLocation.name.toUpperCase()}, ${targetLocation.country.toUpperCase()}:
${weatherText}
`;

    // 3. Create ephemeral auth token using Google's v1beta auth_tokens endpoint
    let selectedModel = GEMINI_LIVE_MODELS[0];
    let tokenData: any = null;
    let lastError = '';

    for (const model of GEMINI_LIVE_MODELS) {
      try {
        const tokenRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/auth_tokens?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uses: 1,
              expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              bidiGenerateContentSetup: {
                model: `models/${model}`,
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: voiceConfig.voiceName,
                      },
                    },
                  },
                },
                systemInstruction: {
                  parts: [{ text: systemInstruction }],
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
            }),
          }
        );

        if (tokenRes.ok) {
          tokenData = await tokenRes.json();
          selectedModel = model;
          break;
        } else {
          const errText = await tokenRes.text();
          lastError = `${tokenRes.status}: ${errText}`;
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error';
      }
    }

    if (!tokenData?.name) {
      return NextResponse.json(
        {
          error: `Failed to create Gemini Live session token (${lastError}). Please verify your GEMINI_API_KEY has Gemini Live API access.`,
          isConfigError: true,
        },
        { status: 502 }
      );
    }

    // 4. Return ephemeral token to client (System instructions are server-controlled and embedded in token)
    return NextResponse.json({
      token: tokenData.name,
      model: selectedModel,
      voice: voiceConfig.voiceName,
      location: targetLocation,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Internal server error while initializing voice mode',
      },
      { status: 500 }
    );
  }
}
