import { NextRequest, NextResponse } from 'next/server';
import { sanitizeTextForSpeech } from '@/lib/voice/speechSanitizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GNANI_TTS_URL = 'https://api.vachana.ai/api/v1/tts/inference';
const MAX_TEXT_LENGTH = 4_000;
const REQUEST_TIMEOUT_MS = 20_000;
const TIMBRE_MODEL = 'timbre-v3.0';
const TIMBRE_VOICE = 'Shivani';

const SUPPORTED_LANGUAGE_CODES = new Set([
  'bn-IN',
  'en-IN',
  'gu-IN',
  'hi-IN',
  'kn-IN',
  'ml-IN',
  'mr-IN',
  'pa-IN',
  'ta-IN',
  'te-IN',
]);

function errorResponse(error: string, status: number, retryable = false) {
  return NextResponse.json({ error, retryable }, { status });
}

function mapUpstreamError(status: number): { error: string; retryable: boolean } {
  if (status === 401 || status === 402 || status === 403) {
    return { error: 'Voice playback is unavailable. Please try again later.', retryable: false };
  }
  if (status === 429) {
    return { error: 'Voice playback is busy. Please wait a moment and retry.', retryable: true };
  }
  if (status === 504) {
    return { error: 'Voice playback timed out. Please try again.', retryable: true };
  }
  return { error: 'Voice playback could not be generated. Please try again.', retryable: status >= 500 };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return errorResponse('Voice playback is not configured on this server.', 503);
  }

  try {
    const body: unknown = await request.json();
    const rawText =
      typeof body === 'object' && body !== null && 'text' in body && typeof body.text === 'string'
        ? body.text.trim()
        : '';
    const languageCode =
      typeof body === 'object' && body !== null && 'languageCode' in body && typeof body.languageCode === 'string'
        ? body.languageCode
        : '';

    if (!rawText) {
      return errorResponse('Response text is required for voice playback.', 400);
    }
    if (rawText.length > MAX_TEXT_LENGTH) {
      return errorResponse('This response is too long to speak. The text answer is still available.', 413);
    }
    if (!SUPPORTED_LANGUAGE_CODES.has(languageCode)) {
      return errorResponse('The selected language is not supported by Gnani Timbre.', 400);
    }

    // Ensure speech text is stripped of raw markdown and weather metrics are spoken naturally
    const text = sanitizeTextForSpeech(rawText, languageCode);
    if (!text) {
      return errorResponse('Response text is required for voice playback.', 400);
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(GNANI_TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key-ID': apiKey,
        },
        body: JSON.stringify({
          text,
          model: TIMBRE_MODEL,
          voice: TIMBRE_VOICE,
          language: languageCode,
          speed: 1.0,
          audio_config: {
            sample_rate: 24_000,
            num_channels: 1,
            sample_width: 2,
            encoding: 'linear_pcm',
            container: 'wav',
          },
        }),
        signal: abortController.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return errorResponse('Voice playback timed out. Please try again.', 504, true);
      }
      return errorResponse('Unable to reach the voice playback service. Please try again.', 502, true);
    } finally {
      clearTimeout(timeout);
    }

    if (!upstreamResponse.ok) {
      const mapped = mapUpstreamError(upstreamResponse.status);
      return errorResponse(mapped.error, upstreamResponse.status === 429 ? 429 : 502, mapped.retryable);
    }

    const contentType = upstreamResponse.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('audio/wav')) {
      return errorResponse('Voice playback service returned an unsupported audio format.', 502, true);
    }

    const audio = await upstreamResponse.arrayBuffer();
    if (audio.byteLength === 0) {
      return errorResponse('Voice playback service returned empty audio. Please try again.', 502, true);
    }

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return errorResponse('Unable to process the voice playback request. Please try again.', 400);
  }
}
