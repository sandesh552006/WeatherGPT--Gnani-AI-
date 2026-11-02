/**
 * Gemini Live API Client for Real-Time Bidirectional Voice Interaction
 * Uses Google's v1beta BidiGenerateContentConstrained WebSocket endpoint with ephemeral tokens.
 */

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

export interface TurnData {
  userText: string;
  assistantText: string;
}

export interface GeminiLiveClientOptions {
  onStateChange: (state: VoiceState) => void;
  onError: (errorMessage: string) => void;
  onTurnComplete: (turn: TurnData) => void;
  onTranscriptUpdate?: (userText: string, assistantText: string) => void;
  language?: string;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContextIn: AudioContext | null = null;
  private audioContextOut: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private speechRecognizer: any = null;

  private state: VoiceState = 'idle';
  private scheduledAudioSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;

  private currentUserTranscript: string = '';
  private currentAssistantTranscript: string = '';
  private options: GeminiLiveClientOptions;

  private isClosedExplicitly: boolean = false;
  private hasSentSetup: boolean = false;
  private isSetupAccepted: boolean = false;
  private hasSentFirstAudioChunk: boolean = false;

  private token: string = '';
  private model: string = '';

  constructor(options: GeminiLiveClientOptions) {
    this.options = options;
  }

  public getState(): VoiceState {
    return this.state;
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    this.options.onStateChange(newState);
  }

  /**
   * Connect to Gemini Live API using ephemeral token
   */
  public async connect(token: string, model: string): Promise<void> {
    this.token = token;
    this.model = model;
    this.isClosedExplicitly = false;
    this.hasSentSetup = false;
    this.isSetupAccepted = false;
    this.hasSentFirstAudioChunk = false;
    this.currentUserTranscript = '';
    this.currentAssistantTranscript = '';

    this.setState('connecting');

    try {
      // 1. Request microphone permission early during user gesture
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Initialize Browser Web Speech for parallel local user speech transcription
      this.initSpeechRecognition();

      // 3. Connect to the constrained WebSocket endpoint for ephemeral tokens
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(
        token
      )}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Gemini Live] WebSocket opened');

        // Send EXACTLY ONE Gemini Live setup message as the FIRST message
        if (!this.hasSentSetup) {
          this.hasSentSetup = true;
          const formattedModel = this.model.startsWith('models/')
            ? this.model
            : `models/${this.model}`;

          const setupMessage = {
            setup: {
              model: formattedModel,
            },
          };

          this.ws?.send(JSON.stringify(setupMessage));
          console.log('[Gemini Live] Setup sent for model:', formattedModel);
        }
      };

      this.ws.onmessage = async (event: MessageEvent) => {
        await this.handleServerMessage(event.data);
      };

      this.ws.onerror = (err) => {
        if (!this.isClosedExplicitly) {
          console.error('[Gemini Live] WebSocket error:', err);
          this.options.onError(
            'Connection to Gemini Live API failed. Please check network or API configuration.'
          );
          this.setState('error');
        }
      };

      this.ws.onclose = (event) => {
        console.log(
          `[Gemini Live] WebSocket closed: code=${event.code}, reason=${event.reason || 'None'}`
        );
        if (!this.isClosedExplicitly) {
          this.cleanup();
          this.setState('idle');
        }
      };
    } catch (err: any) {
      this.cleanup();
      console.error('[Gemini Live] Connection initialization error:', err);
      const msg =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access to use voice mode.'
          : err?.message || 'Failed to initialize voice session.';
      this.options.onError(msg);
      this.setState('error');
    }
  }

  /**
   * Initializes local speech recognition as a parallel transcription fallback
   * so user query text is always accurately captured in chat history
   */
  private initSpeechRecognition() {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;

      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        ml: 'ml-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        pa: 'pa-IN',
        or: 'or-IN',
        as: 'as-IN',
      };
      recognizer.lang = langMap[this.options.language || 'en'] || 'en-IN';

      recognizer.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            this.currentUserTranscript = (this.currentUserTranscript + ' ' + transcript).trim();
          } else {
            interim += transcript;
          }
        }
        const fullUserText = (this.currentUserTranscript + ' ' + interim).trim();
        if (this.options.onTranscriptUpdate) {
          this.options.onTranscriptUpdate(fullUserText, this.currentAssistantTranscript);
        }
      };

      recognizer.onerror = () => {
        // Speech recognition error is non-fatal; Live API audio continues
      };

      recognizer.start();
      this.speechRecognizer = recognizer;
    } catch {
      // Speech recognition not available; fallback to audio only
    }
  }

  /**
   * Capture audio at 16kHz mono and stream PCM chunks to WebSocket
   * ONLY called AFTER setup is acknowledged by the server
   */
  private startAudioCapture() {
    if (!this.mediaStream) return;
    if (!this.isSetupAccepted) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContextIn = new AudioContextClass({ sampleRate: 16000 });
      const source = this.audioContextIn.createMediaStreamSource(this.mediaStream);

      // 2048 samples per chunk @ 16kHz ≈ 128ms latency
      this.scriptProcessor = this.audioContextIn.createScriptProcessor(2048, 1, 1);

      this.scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.isSetupAccepted || this.state === 'error' || this.isClosedExplicitly) return;
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32Array to 16-bit linear PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert buffer to base64
        let binary = '';
        const bytes = new Uint8Array(pcm16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        // Send realtimeInput chunk using current Live API audio format
        const clientMessage = {
          realtimeInput: {
            audio: {
              data: base64Data,
              mimeType: 'audio/pcm;rate=16000',
            },
          },
        };

        this.ws.send(JSON.stringify(clientMessage));

        if (!this.hasSentFirstAudioChunk) {
          this.hasSentFirstAudioChunk = true;
          console.log('[Gemini Live] First audio chunk sent');
        }
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContextIn.destination);
      console.log('[Gemini Live] Microphone started');
    } catch (err) {
      console.error('[Gemini Live] Error starting audio capture:', err);
    }
  }

  /**
   * Parse and handle incoming server messages
   */
  private async handleServerMessage(data: any) {
    let msg: any;
    try {
      if (typeof data === 'string') {
        msg = JSON.parse(data);
      } else if (data instanceof Blob) {
        const text = await data.text();
        msg = JSON.parse(text);
      } else {
        return;
      }
    } catch {
      return;
    }

    // 1. Handle initial setup acknowledgement
    if (msg.setupComplete) {
      console.log('[Gemini Live] Setup acknowledgement received: setupComplete');
      this.isSetupAccepted = true;
      this.startAudioCapture();
      this.setState('listening');
      return;
    }

    // 2. Handle error message from server
    if (msg.error) {
      console.error('[Gemini Live] Server error received:', msg.error);
      this.options.onError(msg.error.message || 'Error from Gemini Live API');
      this.setState('error');
      return;
    }

    // 3. Check for serverContent
    if (msg.serverContent) {
      const {
        modelTurn,
        turnComplete,
        interrupted,
        inputTranscription,
        interimInputTranscription,
        outputTranscription,
      } = msg.serverContent;

      // Handle user interruption (barge-in)
      if (interrupted) {
        this.stopAudioPlayback();
        this.setState('listening');
        return;
      }

      // Handle native user speech transcription from Gemini Live
      if (inputTranscription?.text) {
        this.currentUserTranscript = inputTranscription.text.trim();
        if (this.options.onTranscriptUpdate) {
          this.options.onTranscriptUpdate(
            this.currentUserTranscript,
            this.currentAssistantTranscript
          );
        }
      } else if (interimInputTranscription?.text && !this.currentUserTranscript) {
        if (this.options.onTranscriptUpdate) {
          this.options.onTranscriptUpdate(
            interimInputTranscription.text.trim(),
            this.currentAssistantTranscript
          );
        }
      }

      // Handle model output transcription if provided separately
      if (outputTranscription?.text && !this.currentAssistantTranscript) {
        this.currentAssistantTranscript = outputTranscription.text.trim();
      }

      // Process model output parts
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          // Model text transcript
          if (part.text) {
            this.currentAssistantTranscript += part.text;
            if (this.options.onTranscriptUpdate) {
              this.options.onTranscriptUpdate(
                this.currentUserTranscript,
                this.currentAssistantTranscript
              );
            }
          }

          // Model native audio stream chunk
          if (part.inlineData && part.inlineData.data) {
            this.setState('speaking');
            this.playPcm24kAudio(part.inlineData.data);
          }
        }
      }

      // Turn finished
      if (turnComplete) {
        const userText = this.currentUserTranscript.trim();
        const assistantText = this.currentAssistantTranscript.trim();

        if (userText || assistantText) {
          this.options.onTurnComplete({
            userText: userText || '🎙️ Voice Query',
            assistantText: assistantText || 'Received audio forecast.',
          });
        }

        // Reset transcripts for next turn
        this.currentUserTranscript = '';
        this.currentAssistantTranscript = '';

        // Transition state after playback finishes
        setTimeout(() => {
          if (this.state === 'speaking') {
            this.setState('listening');
          }
        }, 1000);
      }
    }
  }

  /**
   * Play back 24kHz linear PCM audio chunk received from Gemini
   */
  private playPcm24kAudio(base64Data: string) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContextOut || this.audioContextOut.state === 'closed') {
        this.audioContextOut = new AudioContextClass({ sampleRate: 24000 });
        this.nextPlayTime = this.audioContextOut.currentTime;
      }

      if (this.audioContextOut.state === 'suspended') {
        this.audioContextOut.resume();
      }

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      const audioBuffer = this.audioContextOut.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioContextOut.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContextOut.destination);

      const startAt = Math.max(this.audioContextOut.currentTime, this.nextPlayTime);
      source.start(startAt);
      this.nextPlayTime = startAt + audioBuffer.duration;

      this.scheduledAudioSources.push(source);
      source.onended = () => {
        const idx = this.scheduledAudioSources.indexOf(source);
        if (idx !== -1) this.scheduledAudioSources.splice(idx, 1);
        if (this.scheduledAudioSources.length === 0 && this.state === 'speaking') {
          this.setState('listening');
        }
      };
    } catch (e) {
      console.warn('Error playing audio chunk:', e);
    }
  }

  /**
   * Stops currently scheduled audio chunks (for interruptions or stopping session)
   */
  private stopAudioPlayback() {
    for (const src of this.scheduledAudioSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    }
    this.scheduledAudioSources = [];
    if (this.audioContextOut) {
      this.nextPlayTime = this.audioContextOut.currentTime;
    }
  }

  /**
   * Stop voice mode and release all microphone, audio, and WebSocket resources
   */
  public stop() {
    this.isClosedExplicitly = true;
    this.cleanup();
    this.setState('idle');
  }

  private cleanup() {
    this.stopAudioPlayback();
    this.isSetupAccepted = false;
    this.hasSentSetup = false;
    this.hasSentFirstAudioChunk = false;

    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.stop();
      } catch {}
      this.speechRecognizer = null;
    }

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.audioContextIn && this.audioContextIn.state !== 'closed') {
      try {
        this.audioContextIn.close();
      } catch {}
      this.audioContextIn = null;
    }

    if (this.audioContextOut && this.audioContextOut.state !== 'closed') {
      try {
        this.audioContextOut.close();
      } catch {}
      this.audioContextOut = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.ws) {
      try {
        this.ws.close(1000, 'Session stopped by user');
      } catch {}
      this.ws = null;
    }
  }
}
