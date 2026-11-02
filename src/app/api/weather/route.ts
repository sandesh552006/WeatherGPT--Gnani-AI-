import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherData } from '@/lib/weather';
import { GeoLocation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');
    const name = searchParams.get('name') || 'New Delhi';
    const country = searchParams.get('country') || 'India';
    const timezone = searchParams.get('timezone') || 'Asia/Kolkata';

    const latitude = parseFloat(latStr || '28.6214');
    const longitude = parseFloat(lonStr || '77.2148');

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      );
    }

    const location: GeoLocation = {
      name,
      country,
      latitude,
      longitude,
      timezone,
    };

    const weatherData = await fetchWeatherData(location);
    return NextResponse.json(weatherData);
  } catch (error: any) {
    console.error('Weather API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data', message: error?.message },
      { status: 500 }
    );
  }
}
