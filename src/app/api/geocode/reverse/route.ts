import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { error: 'Missing lat or lon parameter' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude coordinates' },
        { status: 400 }
      );
    }

    const location = await reverseGeocode(lat, lon);
    return NextResponse.json({ location });
  } catch (error: any) {
    console.error('Reverse geocode route error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode coordinates', message: error?.message },
      { status: 500 }
    );
  }
}
