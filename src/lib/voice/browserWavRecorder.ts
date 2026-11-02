const TARGET_SAMPLE_RATE = 16_000;

export const MAX_GNANI_RECORDING_SECONDS = 25;

export interface WavRecording {
  stop: () => Promise<Blob>;
}

function mergeSamples(chunks: Float32Array[], totalLength: number): Float32Array {
  const merged = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function resampleTo16k(input: Float32Array, sourceSampleRate: number): Float32Array {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) return input;

  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.round(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const start = Math.floor(outputIndex * ratio);
    const end = Math.min(Math.floor((outputIndex + 1) * ratio), input.length);

    if (end <= start) {
      output[outputIndex] = input[Math.min(start, input.length - 1)] || 0;
      continue;
    }

    let sum = 0;
    for (let inputIndex = start; inputIndex < end; inputIndex += 1) {
      sum += input[inputIndex];
    }
    output[outputIndex] = sum / (end - start);
  }

  return output;
}

function encodeMonoPcmWav(samples: Float32Array): Blob {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(44 + index * bytesPerSample, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Captures microphone audio as a mono 16 kHz PCM WAV file. This avoids relying
 * on browser-specific MediaRecorder WebM/Opus output, which Gnani REST STT does
 * not list as a supported input format.
 */
export async function startWavRecording(): Promise<WavRecording> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone recording is not supported by this browser.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const AudioContextClass = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextClass) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('Audio recording is not supported by this browser.');
  }

  const audioContext = new AudioContextClass();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0;
  const chunks: Float32Array[] = [];
  let totalLength = 0;
  let stopped = false;

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    const copy = new Float32Array(input.length);
    copy.set(input);
    chunks.push(copy);
    totalLength += copy.length;
  };

  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(audioContext.destination);

  return {
    stop: async () => {
      if (stopped) throw new Error('The recording has already stopped.');
      stopped = true;

      processor.onaudioprocess = null;
      source.disconnect();
      processor.disconnect();
      silentGain.disconnect();
      stream.getTracks().forEach((track) => track.stop());

      const samples = mergeSamples(chunks, totalLength);
      const resampled = resampleTo16k(samples, audioContext.sampleRate);
      await audioContext.close();

      if (resampled.length === 0) {
        throw new Error('No microphone audio was captured. Please try again.');
      }

      return encodeMonoPcmWav(resampled);
    },
  };
}
