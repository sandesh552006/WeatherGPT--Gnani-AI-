import { NextRequest, NextResponse } from 'next/server';
import { fetchIndiaGridWeather } from '@/lib/weather';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get('refresh') === 'true';

    const data = await fetchIndiaGridWeather(refresh);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('India Weather Grid API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch India grid weather data', message: error?.message },
      { status: 500 }
    );
  }
}
