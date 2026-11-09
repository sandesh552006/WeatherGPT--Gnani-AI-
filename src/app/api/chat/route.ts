import { NextRequest, NextResponse } from 'next/server';
import { ChatApiRequest, GeoLocation, WeatherData } from '@/lib/types';
import {
  extractLocationQuery,
  extractComparisonLocations,
  getLastLocationFromHistory,
  isPureGreetingOrCasual,
  generateWeatherChatResponse,
} from '@/lib/gemini';
import { resolveLocation } from '@/lib/geocoding';
import { fetchWeatherData } from '@/lib/weather';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: ChatApiRequest = await req.json();
    const { message, history = [], locationContext, language = 'en' } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Default location from client context or safe Indian fallback
    let targetLocation: GeoLocation = {
      name: locationContext?.name || 'New Delhi',
      country: locationContext?.country || 'India',
      country_code: 'IN',
      admin1: locationContext?.admin1 || locationContext?.state,
      admin2: locationContext?.admin2 || locationContext?.district,
      state: locationContext?.state || locationContext?.admin1,
      district: locationContext?.district || locationContext?.admin2,
      latitude: locationContext?.latitude || 28.6214,
      longitude: locationContext?.longitude || 77.2148,
      timezone: 'Asia/Kolkata',
    };

    let secondaryWeatherData: WeatherData | null = null;

    // 1. Detect if the user is comparing two cities (e.g. "Which is hotter: Pune or Mumbai?")
    const comparison = extractComparisonLocations(message, history);

    if (comparison.isComparison && comparison.primaryCity && comparison.secondaryCity) {
      const [res1, res2] = await Promise.all([
        resolveLocation(comparison.primaryCity),
        resolveLocation(comparison.secondaryCity),
      ]);

      if (res1.matched && res2.matched) {
        targetLocation = res1.matched;
        try {
          secondaryWeatherData = await fetchWeatherData(res2.matched);
        } catch (e) {
          console.warn('Failed to fetch secondary weather for comparison:', e);
        }
      } else if (res1.matched) {
        targetLocation = res1.matched;
      }
    } else {
      // 2. Single city detection from user message (skip for pure greetings / casual pleasantries)
      const isCasual = isPureGreetingOrCasual(message);
      const extractedLocationStr = isCasual ? null : extractLocationQuery(message, history);

      if (extractedLocationStr) {
        const { matched, ambiguous, alternatives } = await resolveLocation(extractedLocationStr);

        if (ambiguous && alternatives && alternatives.length > 1) {
          const optionsList = alternatives
            .map((alt) => `• **${alt.name}** (${alt.admin1 ? alt.admin1 + ', ' : ''}${alt.country})`)
            .join('\n');

          const clarifyReply =
            language === 'hi'
              ? `आप कौन सा स्थान जानना चाहते हैं? मुझे "${extractedLocationStr}" नाम से एक से अधिक स्थान मिले:\n\n${optionsList}\n\nकृपया शहर और राज्य या देश स्पष्ट करें।`
              : language === 'mr'
              ? `तुम्हाला कोणते ठिकाण अभिप्रेत आहे? मला "${extractedLocationStr}" नावाची एकापेक्षा जास्त ठिकाणे आढळली:\n\n${optionsList}\n\nकृपया शहर आणि राज्य किंवा देश स्पष्ट करा.`
              : `Which location do you mean? I found multiple places named "${extractedLocationStr}":\n\n${optionsList}\n\nPlease specify the city and state or country.`;

          return NextResponse.json({
            reply: clarifyReply,
            followUps: alternatives.slice(0, 3).map((a) => `Weather in ${a.name}, ${a.country}`),
            location: targetLocation,
          });
        }

        if (matched) {
          targetLocation = matched;
        } else if (extractedLocationStr.length >= 2) {
          const notFoundReply =
            language === 'hi'
              ? `मुझे "${extractedLocationStr}" स्थान नहीं मिला। क्या आप कृपया सही शहर या जिले का नाम बता सकते हैं?`
              : language === 'mr'
              ? `मला "${extractedLocationStr}" हे ठिकाण सापडले नाही. कृपया आपण योग्य शहर किंवा जिल्ह्याचे नाव सांगू शकता का?`
              : `I couldn't find the location "${extractedLocationStr}". Could you please check the spelling or provide the city and state?`;

          return NextResponse.json({
            reply: notFoundReply,
            followUps: [
              language === 'hi' ? 'नई दिल्ली में मौसम' : language === 'mr' ? 'नवी दिल्लीत हवामान' : 'Weather in New Delhi',
              language === 'hi' ? 'मुंबई में मौसम' : language === 'mr' ? 'मुंबईत हवामान' : 'Weather in Mumbai',
              language === 'hi' ? 'पुणे में मौसम' : language === 'mr' ? 'पुण्यात हवामान' : 'Weather in Pune',
            ],
            location: targetLocation,
          });
        }
      } else if (!locationContext || !locationContext.name || locationContext.name === 'New Delhi') {
        // If user did not specify a new location, recover the last discussed city from conversation history
        const priorCity = getLastLocationFromHistory(history);
        if (priorCity && priorCity.toLowerCase() !== targetLocation.name.toLowerCase()) {
          const { matched } = await resolveLocation(priorCity);
          if (matched) {
            targetLocation = matched;
          }
        }
      }
    }

    // 3. Fetch verified real weather data from Open-Meteo
    const weatherData = await fetchWeatherData(targetLocation);

    // 4. Generate grounded, natural, conversational response with Gemini
    const aiResponse = await generateWeatherChatResponse({
      userMessage: message,
      history,
      weatherData,
      language,
      secondaryWeatherData,
    });

    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        reply: "I'm having a little trouble retrieving the latest weather right now. Please check your network connection and try again in a moment!",
      },
      { status: 500 }
    );
  }
}
