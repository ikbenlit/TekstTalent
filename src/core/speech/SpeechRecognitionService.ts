import { SpeechConfig } from '@/config/speech.config';
import { DeviceDetectionService } from '@/core/device/DeviceDetectionService';
import { DebugLogger } from '@/core/utils/DebugLogger';

export class SpeechRecognitionService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private config: SpeechConfig = {};
  private deviceDetection: DeviceDetectionService;
  private recordingInterval: NodeJS.Timeout | null = null;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private readonly MAX_RECORDING_TIME = 60000; // 60 seconden maximum
  private readonly SILENCE_THRESHOLD = -50; // dB
  private readonly SILENCE_DURATION = 2000; // 2 seconden stilte voordat we stoppen

  constructor(deviceDetection?: DeviceDetectionService) {
    this.deviceDetection = deviceDetection || new DeviceDetectionService();
  }

  public async startListening(onResult: (text: string) => void, onError?: (error: string) => void): Promise<void> {
    try {
      if (this.isRecording) {
        DebugLogger.log('[Speech] Already recording, stopping current recording');
        this.stopListening();
      }

      this.config.onResult = onResult;
      this.config.onError = onError;
      
      if (!this.stream) {
        // Request microphone access only if we don't have a stream
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });

        // Setup audio analysis for silence detection
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.stream);
        this.mediaStreamSource.connect(this.analyser);
        this.analyser.fftSize = 2048;
      }
      
      // Setup media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      // Only clear audioChunks if we're starting a new recording
      if (!this.isPaused) {
        this.audioChunks = [];
      }
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onerror = (event: Event) => {
        const error = event instanceof Error ? event : new Error('Unknown recording error');
        DebugLogger.error('[Speech] Recording error:', error);
        this.config.onError?.('Fout tijdens de opname');
        this.cleanup();
      };
      
      this.mediaRecorder.onstop = async () => {
        try {
          if (this.audioChunks.length === 0) {
            DebugLogger.log('[Speech] No audio recorded');
            this.config.onError?.('Geen audio opgenomen');
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { 
            type: 'audio/webm;codecs=opus' 
          });
          
          // Check minimale grootte (5KB is een betere minimum grootte voor een betekenisvolle opname)
          if (audioBlob.size < 5 * 1024) {
            DebugLogger.log(`[Speech] Recording too short: ${audioBlob.size} bytes`);
            this.config.onError?.('Opname te kort, probeer opnieuw');
            return;
          }

          await this.transcribeAudio(audioBlob);
        } catch (error) {
          DebugLogger.error('[Speech] Transcription error:', error);
          this.config.onError?.(error instanceof Error ? error.message : 'Fout bij het verwerken van de spraakopname');
        } finally {
          this.cleanup();
        }
      };
      
      // Start recording
      this.mediaRecorder.start(1000); // Chunk elke seconde
      this.isRecording = true;
      DebugLogger.log('[Speech] Started recording');

      // Start silence detection
      this.startSilenceDetection();

      // Set maximum recording time
      this.recordingInterval = setTimeout(() => {
        if (this.isRecording) {
          DebugLogger.log('[Speech] Maximum recording time reached');
          this.stopListening();
        }
      }, this.MAX_RECORDING_TIME);
      
    } catch (error) {
      DebugLogger.error('[Speech] Start error:', error);
      this.config.onError?.('Fout bij het starten van de spraakopname');
      this.cleanup();
    }
  }

  private startSilenceDetection(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    let silenceStart: number | null = null;

    const checkSilence = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getFloatTimeDomainData(dataArray);
      
      // Calculate RMS value
      let rms = 0;
      for (let i = 0; i < bufferLength; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / bufferLength);
      
      // Convert to dB
      const db = 20 * Math.log10(rms);

      // Als er spraak is, reset de silence timer
      if (db >= this.SILENCE_THRESHOLD) {
        silenceStart = null;
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
          this.silenceTimeout = null;
        }
      } else if (silenceStart === null) {
        // Start silence timer
        silenceStart = Date.now();
        this.silenceTimeout = setTimeout(() => {
          DebugLogger.log('[Speech] Silence detected for 2 seconds, stopping recording');
          this.stopListening();
        }, this.SILENCE_DURATION);
      }

      // Continue checking while recording
      if (this.isRecording) {
        requestAnimationFrame(checkSilence);
      }
    };

    requestAnimationFrame(checkSilence);
  }

  public stopListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve();
        return;
      }

      // Store the original callbacks
      const originalOnResult = this.config.onResult;
      const originalOnError = this.config.onError;

      // Override callbacks to handle promise resolution
      this.config.onResult = (text: string) => {
        originalOnResult?.(text);
        this.config.onResult = originalOnResult;
        this.config.onError = originalOnError;
        resolve();
      };

      this.config.onError = (error: string) => {
        originalOnError?.(error);
        this.config.onResult = originalOnResult;
        this.config.onError = originalOnError;
        reject(new Error(error));
      };

      // Set up onstop handler before stopping
      this.mediaRecorder.onstop = async () => {
        try {
          if (this.audioChunks.length === 0) {
            DebugLogger.log('[Speech] No audio recorded');
            this.config.onError?.('Geen audio opgenomen');
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { 
            type: 'audio/webm;codecs=opus' 
          });
          
          // Check minimale grootte (5KB is een betere minimum grootte voor een betekenisvolle opname)
          if (audioBlob.size < 5 * 1024) {
            DebugLogger.log(`[Speech] Recording too short: ${audioBlob.size} bytes`);
            this.config.onError?.('Opname te kort, probeer opnieuw');
            return;
          }

          await this.transcribeAudio(audioBlob);
        } catch (error) {
          DebugLogger.error('[Speech] Transcription error:', error);
          this.config.onError?.(error instanceof Error ? error.message : 'Fout bij het verwerken van de spraakopname');
        } finally {
          this.cleanup();
        }
      };

      // Stop recording
      this.isRecording = false; // Set this first to stop the silence detection loop
      this.mediaRecorder.stop();
      DebugLogger.log('[Speech] Stopped recording');
    });
  }

  private cleanup(): void {
    // Clear timeouts
    if (this.recordingInterval) {
      clearTimeout(this.recordingInterval);
      this.recordingInterval = null;
    }
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    // Stop and cleanup media recorder
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (error) {
          // Ignore stop errors
        }
      }
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Cleanup audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
      this.mediaStreamSource = null;
    }

    // Reset state
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;
  }

  private async transcribeAudio(audioBlob: Blob): Promise<void> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'nl');
      
      DebugLogger.log('[Speech] Starting transcription...');
      
      // Send to our API endpoint
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Transcription failed');
      }
      
      const data = await response.json();
      if (data.text) {
        DebugLogger.log('[Speech] Transcription received');
        // Append new text to existing text
        this.config.onResult?.(data.text);
      } else {
        throw new Error('Geen tekst ontvangen van de transcriptie');
      }
      
    } catch (error) {
      DebugLogger.error('[Speech] Transcription error:', error);
      throw error;
    }
  }

  public isSupported(): boolean {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    DebugLogger.log('[Speech] Support check:', supported);
    return supported;
  }

  public pauseListening(): void {
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      this.isPaused = true;
      this.isRecording = false; // Pause silence detection
      this.mediaRecorder.pause();
      DebugLogger.log('[Speech] Paused recording');
    }
  }

  public resumeListening(): void {
    if (this.mediaRecorder && this.isPaused) {
      this.isPaused = false;
      this.isRecording = true; // Resume silence detection
      this.mediaRecorder.resume();
      this.startSilenceDetection(); // Restart silence detection
      DebugLogger.log('[Speech] Resumed recording');
    }
  }
} 