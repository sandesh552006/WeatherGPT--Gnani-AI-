import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GNANI_STT_URL = 'https://api.vachana.ai/stt/v3';
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_AUDIO_BYTES + 64 * 1024;
const MIN_AUDIO_DURATION_SECONDS = 0.25;
const MAX_AUDIO_DURATION_SECONDS = 25;
const REQUEST_TIMEOUT_MS = 15_000;

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

interface WavMetadata {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

function readFourCc(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

function parsePcmWavMetadata(buffer: ArrayBuffer): WavMetadata | null {
  if (buffer.byteLength < 44) return null;

  const view = new DataView(buffer);
  if (readFourCc(view, 0) !== 'RIFF' || readFourCc(view, 8) !== 'WAVE') return null;

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataSize = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readFourCc(view, offset);
    const chunkSize = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;

    if (dataOffset + chunkSize > view.byteLength) return null;

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      const audioFormat = view.getUint16(dataOffset, true);
      if (audioFormat !== 1) return null;
      channels = view.getUint16(dataOffset + 2, true);
      sampleRate = view.getUint32(dataOffset + 4, true);
      bitsPerSample = view.getUint16(dataOffset + 14, true);
    }

    if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);
  if (!sampleRate || !channels || !bitsPerSample || !dataSize || !Number.isFinite(bytesPerSecond)) {
    return null;
  }

  return {
    durationSeconds: dataSize / bytesPerSecond,
    sampleRate,
    channels,
    bitsPerSample,
  };
}

function errorResponse(error: string, status: number, retryable = false) {
  return NextResponse.json({ error, retryable }, { status });
}

function mapUpstreamError(status: number): { error: string; retryable: boolean } {
  if (status === 401 || status === 402 || status === 403) {
    return { error: 'Voice transcription is unavailable. Please try again later.', retryable: false };
  }
  if (status === 429) {
    return { error: 'Voice transcription is busy. Please wait a moment and retry.', retryable: true };
  }
  if (status === 504) {
    return { error: 'Voice transcription timed out. Please record a shorter question and retry.', retryable: true };
  }
  return { error: 'Voice transcription failed. Please try again.', retryable: status >= 500 };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return errorResponse('Voice transcription is not configured on this server.', 503);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse('The recording is too large. Please record a shorter question.', 413);
  }

  if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
    return errorResponse('Audio must be uploaded as multipart form data.', 415);
  }

  try {
    const formData = await request.formData();
    const audio = formData.get('audio');
    const languageCode = formData.get('languageCode');

    if (!audio || typeof audio === 'string' || !('arrayBuffer' in audio)) {
      return errorResponse('Please record an audio question before transcribing.', 400);
    }
    const audioFile = audio as File;
    if (typeof languageCode !== 'string' || !SUPPORTED_LANGUAGE_CODES.has(languageCode)) {
      return errorResponse('The selected language is not supported by Gnani Prisma STT.', 400);
    }
    if (audioFile.size === 0) {
      return errorResponse('The recording is empty. Please try again.', 400);
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return errorResponse('The recording is too large. Please record a shorter question.', 413);
    }
    if (!['audio/wav', 'audio/x-wav'].includes(audioFile.type.toLowerCase())) {
      return errorResponse('Only WAV recordings are supported for voice transcription.', 415);
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const wav = parsePcmWavMetadata(audioBuffer);
    if (!wav || wav.sampleRate !== 16_000 || wav.channels !== 1 || wav.bitsPerSample !== 16) {
      return errorResponse('The recording must be a valid mono 16 kHz WAV file.', 415);
    }
    if (wav.durationSeconds < MIN_AUDIO_DURATION_SECONDS) {
      return errorResponse('The recording is too short. Please speak for a moment and retry.', 400);
    }
    if (wav.durationSeconds > MAX_AUDIO_DURATION_SECONDS) {
      return errorResponse('Recordings must be 25 seconds or less. Please try again.', 413);
    }

    const upstreamForm = new FormData();
    upstreamForm.append('audio_file', new Blob([audioBuffer], { type: 'audio/wav' }), 'weather-question.wav');
    upstreamForm.append('model', 'prisma-v3.0');
    upstreamForm.append('language_code', languageCode);
    upstreamForm.append('format', 'transcribe');

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(GNANI_STT_URL, {
        method: 'POST',
        headers: { 'X-API-Key-ID': apiKey },
        body: upstreamForm,
        signal: abortController.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return errorResponse('Voice transcription timed out. Please try again.', 504, true);
      }
      return errorResponse('Unable to reach the voice transcription service. Please try again.', 502, true);
    } finally {
      clearTimeout(timeout);
    }

    if (!upstreamResponse.ok) {
      const mapped = mapUpstreamError(upstreamResponse.status);
      return errorResponse(mapped.error, upstreamResponse.status === 429 ? 429 : 502, mapped.retryable);
    }

    const result: unknown = await upstreamResponse.json();
    const transcript =
      typeof result === 'object' && result !== null && 'transcript' in result && typeof result.transcript === 'string'
        ? result.transcript.trim()
        : '';

    return NextResponse.json({ transcript, languageCode, durationSeconds: wav.durationSeconds });
  } catch {
    return errorResponse('Unable to process the recording. Please try again.', 400);
  }
}
