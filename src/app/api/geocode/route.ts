import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchLocations(query.trim(), 6);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Geocode API route error:', error);
    return NextResponse.json(
      { error: 'Failed to search locations', message: error?.message },
      { status: 500 }
    );
  }
}
