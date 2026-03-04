// Bridges the tab audio stream with the transcription engine.
// Receives the streamId from the background service worker,
// converts it into a MediaStream, and feeds it to the engine.

import { AudioCaptureError } from '../../shared/errors/index.js';
import { createLogger } from '../../shared/logger/index.js';
import { TranscriptionProvider } from '../../shared/types/index.js';
import { DeepgramEngine } from '../transcription/deepgram.engine.js';
import { ErrorCallback, TranscriptCallback, WebSpeechEngine } from '../transcription/web-speech.engine.js';

const logger = createLogger('AudioCaptureProcessor');

export class AudioCaptureProcessor {
    private stream: MediaStream | null = null;
    private webSpeechEngine: WebSpeechEngine | null = null;
    private deepgramEngine: DeepgramEngine | null = null;

    async start(
        streamId: string,
        provider: TranscriptionProvider,
        language: string,
        onTranscript: TranscriptCallback,
        onError: ErrorCallback,
        deepgramApiKey?: string,
    ): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: streamId,
                    },
                } as MediaTrackConstraints,
                video: false,
            });

            logger.info('Audio stream acquired', { provider });

            switch (provider) {
                case 'webSpeech': {
                    this.webSpeechEngine = new WebSpeechEngine(language, onTranscript, onError);
                    this.webSpeechEngine.start();
                    break;
                }
                case 'deepgram': {
                    if (!deepgramApiKey) {
                        throw new AudioCaptureError('Deepgram API key required');
                    }
                    this.deepgramEngine = new DeepgramEngine(deepgramApiKey, language, onTranscript, onError);
                    this.deepgramEngine.start(this.stream);
                    break;
                }
                default: {
                    const exhaustive: never = provider;
                    throw new AudioCaptureError(`Unknown provider: ${String(exhaustive)}`);
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Failed to start audio capture', { error: msg });
            throw new AudioCaptureError(`Audio capture failed: ${msg}`);
        }
    }

    stop(): void {
        this.webSpeechEngine?.stop();
        this.webSpeechEngine = null;

        this.deepgramEngine?.stop();
        this.deepgramEngine = null;

        if (this.stream) {
            this.stream.getTracks().forEach((track) => { track.stop(); });
            this.stream = null;
        }

        logger.info('Audio capture stopped');
    }
}